# games/services/results.py
from __future__ import annotations

from typing import Dict, Any, List, DefaultDict, Set, Tuple, Optional
from collections import defaultdict
from math import ceil

from django.db.models import Prefetch

from games.models import Game, GamePlayer
from roles.models import Role
from logs.models import Log

"""
Output shape:
{
  "meta": {...},
  "players": [
    {
      "player_id": int, "name": str, "seat_number": int|None,
      "role_name": str|None, "overall_win_rate": float,
      "terminated_round": int|None, "terminated_phase": "day"|"night"|None,
      "performance": { ... }   # metrics (citizen/mafia)
    }, ...
  ],
  "timeline": [ ... ],
  "links": {"full_log": "/game-session/<id>"}
}
"""

# ---- Slug map (adjust if DB uses different slugs) ----
SLUGS = {
    # day
    "fling_target": "fling_target",
    "target": "target",
    "siding": "siding",
    "k_of_n_target": "k_of_n_target",
    "cover": "cover",
    "k_of_n_cover": "k_of_n_cover",
    "dialogue": "dialogue",
    "first_vote": "first_vote",
    "second_vote": "second_vote",
    "defense": "defense",             # Cover for Defense (details contain coverer)
    "claim": "claim",

    # night
    "no_faces_choice": "no_faces_choice",
    "boozers_shot": "boozers_shot",
    "mafia_kill": "mafia_kill",       # → cause "godfather"
    "killer_target": "killer_target", # → cause "killer"
    "snipers_shot": "snipers_shot",   # → cause "sniper"
    "doctors_save": "doctors_save",   # cancels kill on that target
    "punished": "punished",           # treat as "kicked_out"
}

PHASES = ("day", "night")

def _iter_log_targets(log):
    """
    Always return an iterable of LogTarget objects, whether .log_targets is a
    RelatedManager or a plain list.
    """
    lt = getattr(log, "log_targets", None)
    if lt is None:
        return []
    return lt.all() if hasattr(lt, "all") else (lt or [])

def _collect_targets(log):
    """
    Return a list of GamePlayer IDs targeted by this log.
    """
    out = []
    for t in _iter_log_targets(log):
        tid = getattr(t, "target_id", None)
        if tid:
            out.append(int(tid))
    return out



# ------------------ generic helpers ------------------

def _log_sort_key(l: Log) -> Tuple[int, int]:
    """Sort by created_at then id (stable)."""
    ts = 0
    created = getattr(l, "created_at", None)
    try:
        ts = int(created.timestamp()) if created else 0
    except Exception:
        ts = 0
    return ts, int(getattr(l, "id", 0) or 0)


def _safe_role_slug(gp: Optional[GamePlayer]) -> Optional[str]:
    if not gp or not gp.role:
        return None
    return getattr(gp.role, "slug", None)


def _is_mafia_gp(gp: Optional[GamePlayer]) -> Optional[bool]:
    if not gp or not gp.role:
        return None
    return bool(getattr(gp.role, "is_mafia", False))


def _alive_at_start_of_day_fn(total_players: int, day_elims: Dict[int, int], night_elims: Dict[int, int]):
    def _inner(r: int) -> int:
        gone = sum(1 for rr in day_elims.values() if rr < r) + sum(1 for rr in night_elims.values() if rr < r)
        return max(1, total_players - gone)
    return _inner


# ------------------ DAY processing ------------------
def _apply_day(
    rn: int,
    day_logs: List[Log],
    alive_count: int,
    day_elims: Dict[int, int],
    timeline: List[Dict[str, Any]],
    gp_by_id: Dict[int, GamePlayer],
    row_by_gp_id: Dict[int, int],
    rows: List[Dict[str, Any]],
) -> Set[int]:
    """Resolve finalists (from first votes) and unique day elimination (from second votes). Returns finalists set."""
    first_slug = SLUGS["first_vote"]
    second_slug = SLUGS["second_vote"]

    day_logs = sorted(day_logs, key=_log_sort_key)

    # FIRST votes: allow a voter to vote for many candidates (count each unique pair once)
    voters_by_candidate: DefaultDict[int, Set[int]] = defaultdict(set)
    for lg in day_logs:
        at = getattr(lg, "action_type", None)
        if not at or getattr(at, "slug", None) != first_slug:
            continue
        candidate = int(getattr(lg, "game_player_id", 0) or 0)
        for voter in _collect_targets(lg):
            voters_by_candidate[candidate].add(voter)

    first_counts: Dict[int, int] = {cand: len(vs) for cand, vs in voters_by_candidate.items()}

    threshold = ceil((alive_count) / 3.0)
    finalists = [(cand, cnt) for cand, cnt in first_counts.items() if cnt >= threshold]
    finalists.sort(key=lambda x: (-x[1], x[0]))
    if len(finalists) > 3:
        third = finalists[2][1]
        finalists = [f for f in finalists if f[1] >= third]
    finalists_set = {cand for cand, _ in finalists}

    # Timeline finalists
    timeline.append({
        "phase_type": "day",
        "round_number": rn,
        "kind": "finalists",
        "payload": {
            "threshold": threshold,
            "alive": alive_count,
            "candidates": [
                {
                    "gp_id": cand,
                    "player_name": getattr(gp_by_id.get(cand), "player", None) and gp_by_id[cand].player.name or "",
                    "count": cnt,
                }
                for cand, cnt in finalists
            ],
        },
    })

    # SECOND votes: earliest per voter, only for finalists
    if finalists_set:
        voter_second: Dict[int, int] = {}
        for lg in day_logs:
            at = getattr(lg, "action_type", None)
            if not at or getattr(at, "slug", None) != second_slug:
                continue
            candidate = int(getattr(lg, "game_player_id", 0) or 0)
            if candidate not in finalists_set:
                continue
            for voter in _collect_targets(lg):
                if voter and voter not in voter_second:
                    voter_second[voter] = candidate

        second_counts: DefaultDict[int, int] = defaultdict(int)
        for voter, cand in voter_second.items():
            second_counts[cand] += 1

        if second_counts:
            ordered = sorted(second_counts.items(), key=lambda x: (-x[1], x[0]))
            top_cand, top_cnt = ordered[0]
            unique = len(ordered) == 1 or (ordered[0][1] > ordered[1][1])
            if unique:
                day_elims[top_cand] = rn
                idx = row_by_gp_id.get(top_cand)
                if idx is not None and rows[idx]["terminated_round"] is None:
                    rows[idx]["terminated_round"] = rn
                    rows[idx]["terminated_phase"] = "day"
                timeline.append({
                    "phase_type": "day",
                    "round_number": rn,
                    "kind": "termination",
                    "payload": {
                        "gp_id": top_cand,
                        "player_name": getattr(gp_by_id.get(top_cand), "player", None) and gp_by_id[top_cand].player.name or "",
                        "cause": "voting",
                        "second_vote_counts": [
                            {
                                "gp_id": cand,
                                "player_name": getattr(gp_by_id.get(cand), "player", None) and gp_by_id[cand].player.name or "",
                                "count": cnt,
                            }
                            for cand, cnt in ordered
                        ],
                    },
                })

    return finalists_set


# ------------------ NIGHT processing ------------------
def _apply_night(
    rn: int,
    night_logs: List[Log],
    night_elims: Dict[int, int],
    mark_terminated,
    gp_by_id: Dict[int, GamePlayer],
) -> None:
    night_logs = sorted(night_logs, key=_log_sort_key)

    mafia_targets: Set[int] = set()
    killer_targets: Set[int] = set()
    sniper_targets: Set[int] = set()
    punished_targets: Set[int] = set()
    saved: Set[int] = set()

    for lg in night_logs:
        slug = getattr(getattr(lg, "action_type", None), "slug", None)
        if not slug:
            continue
        tgts = set(_collect_targets(lg))
        if slug == SLUGS["mafia_kill"]:
            mafia_targets |= tgts
        elif slug == SLUGS["killer_target"]:
            killer_targets |= tgts
        elif slug == SLUGS["snipers_shot"]:
            sniper_targets |= tgts
        elif slug == SLUGS["doctors_save"]:
            saved |= tgts
        elif slug == SLUGS["punished"]:
            punished_targets |= tgts

    mafia_kills = mafia_targets - saved
    killer_kills = killer_targets - saved
    sniper_kills = sniper_targets - saved

    for gp_id in sorted(mafia_kills):
        if gp_id not in night_elims:
            night_elims[gp_id] = rn
            mark_terminated(gp_id, rn, "night", "godfather")

    for gp_id in sorted(killer_kills):
        if gp_id not in night_elims:
            night_elims[gp_id] = rn
            mark_terminated(gp_id, rn, "night", "killer")

    for gp_id in sorted(sniper_kills):
        if gp_id not in night_elims:
            night_elims[gp_id] = rn
            mark_terminated(gp_id, rn, "night", "sniper")

    for gp_id in sorted(punished_targets):
        if gp_id not in night_elims:
            night_elims[gp_id] = rn
            mark_terminated(gp_id, rn, "night", "kicked_out")


# ------------------ METRICS ------------------
def _get_k(details: Dict[str, Any], default: int = 1) -> int:
    if not isinstance(details, dict):
        return default
    for key in ("k", "K", "min", "min_k"):
        if key in details:
            try:
                return int(details[key])
            except Exception:
                pass
    return default


def _compute_day_finalists_map(
    day_rounds: List[int],
    by_round_phase: Dict[Tuple[str, int], List[Log]],
    alive_at_start_of_day,
) -> Dict[int, Set[int]]:
    """Recompute finalists per day (used for metrics like successful contribution)."""
    finalists_by_day: Dict[int, Set[int]] = {}
    for rn in day_rounds:
        day_logs = sorted(by_round_phase.get(("day", rn), []), key=_log_sort_key)
        # voters per candidate for first votes (allow multi-candidate voting)
        voters_by_candidate: DefaultDict[int, Set[int]] = defaultdict(set)
        for lg in day_logs:
            if getattr(getattr(lg, "action_type", None), "slug", None) != SLUGS["first_vote"]:
                continue
            cand = int(getattr(lg, "game_player_id", 0) or 0)
            for voter in _collect_targets(lg):
                voters_by_candidate[cand].add(voter)

        first_counts: DefaultDict[int, int] = defaultdict(int)
        for cand, voters in voters_by_candidate.items():
            first_counts[cand] = len(voters)

        threshold = ceil((2 * alive_at_start_of_day(rn)) / 3.0)
        finals = [(cand, cnt) for cand, cnt in first_counts.items() if cnt >= threshold]
        finals.sort(key=lambda x: (-x[1], x[0]))
        if len(finals) > 3:
            third = finals[2][1]
            finals = [f for f in finals if f[1] >= third]
        finalists_by_day[rn] = {cand for cand, _ in finals}
    return finalists_by_day


def _compute_overall_win_rate_for_player(player_id: int) -> float:
    """Simple, DB-wide win rate. Adjust if you have a faster annotated query."""
    q = (
        GamePlayer.objects
        .select_related("game", "role")
        .filter(player_id=player_id, game__is_active=False)
    )
    total = q.count()
    if total == 0:
        return 0.0
    wins = 0
    for gp in q:
        winner = (gp.game.winner or "").lower().strip()
        side = "mafia" if getattr(gp.role, "is_mafia", False) else "citizen"
        if winner and winner == side:
            wins += 1
    return wins / float(total)


def _compute_metrics(
    gp_by_id: Dict[int, GamePlayer],
    rows: List[Dict[str, Any]],
    row_by_gp_id: Dict[int, int],
    by_round_phase: Dict[Tuple[str, int], List[Log]],
    day_elims: Dict[int, int],
    night_elims: Dict[int, int],
    alive_at_start_of_day,
) -> None:
    """Fill rows[*]['performance'] and rows[*]['overall_win_rate']."""

    # Pre-calc: finalists per day (for contribution metric & pushes)
    day_rounds = sorted({rn for (ph, rn) in by_round_phase.keys() if ph == "day"})
    finalists_by_day = _compute_day_finalists_map(day_rounds, by_round_phase, alive_at_start_of_day)

    # For doctor success, we need night kill intentions per round
    night_info: Dict[int, Dict[str, Set[int]]] = {}  # rn -> { 'mafia':set, 'killer':set, 'sniper':set, 'saved':set }
    for rn in sorted({rn for (ph, rn) in by_round_phase.keys() if ph == "night"}):
        night_logs = by_round_phase.get(("night", rn), [])
        mafia, killer, sniper, saved = set(), set(), set(), set()
        for lg in night_logs:
            slug = getattr(getattr(lg, "action_type", None), "slug", None)
            tgts = set(_collect_targets(lg))
            if slug == SLUGS["mafia_kill"]:
                mafia |= tgts
            elif slug == SLUGS["killer_target"]:
                killer |= tgts
            elif slug == SLUGS["snipers_shot"]:
                sniper |= tgts
            elif slug == SLUGS["doctors_save"]:
                saved |= tgts
        night_info[rn] = {"mafia": mafia, "killer": killer, "sniper": sniper, "saved": saved}

    # For No Face attribution: night -> {role_slugs_to_hijack: set, noface_gp_id}
    # Map per No Face actor: from night N+1 and onward, steal acts from these roles
    noface_rules: List[Tuple[int, int, Set[str]]] = []  # (start_night, noface_gp_id, roles_to_hijack)
    for rn in sorted({rn for (ph, rn) in by_round_phase.keys() if ph == "night"}):
        for lg in by_round_phase.get(("night", rn), []):
            if getattr(getattr(lg, "action_type", None), "slug", None) != SLUGS["no_faces_choice"]:
                continue
            noface = getattr(lg, "game_player", None)
            tgt_ids = _collect_targets(lg)
            target_gp = gp_by_id.get(tgt_ids[0]) if tgt_ids else None
            if not noface or not target_gp or _is_mafia_gp(target_gp):
                continue
            role_slug = _safe_role_slug(target_gp)
            if role_slug in {"doctor", "sniper", "boozer"}:
                noface_rules.append((rn + 1, noface.id, {role_slug}))

    # Metric counters by GamePlayer id
    perf: Dict[int, Dict[str, Any]] = defaultdict(lambda: defaultdict(int))
    rate_denoms: Dict[int, Dict[str, int]] = defaultdict(lambda: defaultdict(int))

    # ---------- CITIZEN METRICS ----------
    # correct_targets_rate: from fling_target/target/siding (+ k_of_n_target)
    for (ph, rn), logs in by_round_phase.items():
        if ph != "day":
            continue
        for lg in logs:
            slug = getattr(getattr(lg, "action_type", None), "slug", None)
            performer = getattr(lg, "game_player", None)
            if not performer:
                continue
            idx = row_by_gp_id.get(performer.id)
            if idx is None:
                continue
            # only compute for citizens
            if _is_mafia_gp(performer):
                continue

            if slug in {SLUGS["fling_target"], SLUGS["target"], SLUGS["siding"]}:
                # separate_per_target is True in your config -> one target per log typically
                for tid in _collect_targets(lg):
                    rate_denoms[performer.id]["correct_targets"] += 1
                    if _is_mafia_gp(gp_by_id.get(tid)):
                        perf[performer.id]["correct_targets"] += 1

            elif slug == SLUGS["k_of_n_target"]:
                k = _get_k(getattr(lg, "details", {}) or {}, default=1)
                tgts = _collect_targets(lg)
                mafia_hits = sum(1 for tid in tgts if _is_mafia_gp(gp_by_id.get(tid)))
                rate_denoms[performer.id]["correct_targets"] += 1
                if mafia_hits >= k:
                    perf[performer.id]["correct_targets"] += 1

    # successful_contribution_rate: first vote true if (mafia OR finalist),
    # second vote true if (mafia)
    # Count ALL first-vote (voter, candidate) pairs per day (multi-candidate allowed).
    for rn in day_rounds:
        day_logs = sorted(by_round_phase.get(("day", rn), []), key=_log_sort_key)
        finalists = finalists_by_day.get(rn, set())

        # Collect first-vote pairs and earliest-only second votes
        first_pairs: Set[Tuple[int, int]] = set()   # (voter_gp_id, candidate_gp_id)
        second_for_voter: Dict[int, int] = {}

        for lg in day_logs:
            at = getattr(lg, "action_type", None)
            slug = getattr(at, "slug", None) if at else None
            candidate_gp_id = int(getattr(lg, "game_player_id", 0) or 0)
            voters = _collect_targets(lg)

            if slug == SLUGS["first_vote"]:
                # allow a voter to support multiple candidates; de-duplicate per (voter, candidate)
                for v in voters:
                    if v:
                        first_pairs.add((v, candidate_gp_id))

            elif slug == SLUGS["second_vote"]:
                # keep earliest second vote per voter (unless you want multi here, too)
                for v in voters:
                    if v and v not in second_for_voter:
                        second_for_voter[v] = candidate_gp_id

        # Evaluate first-vote "truth" (mafia OR finalist)
        for voter_gp_id, cand_gp_id in first_pairs:
            voter_gp = gp_by_id.get(voter_gp_id)
            if not voter_gp or _is_mafia_gp(voter_gp):
                continue  # only citizens contribute
            rate_denoms[voter_gp_id]["successful_contribution"] += 1
            cand_is_mafia = _is_mafia_gp(gp_by_id.get(cand_gp_id))
            if cand_is_mafia or (cand_gp_id in finalists):
                perf[voter_gp_id]["successful_contribution"] += 1

        # Evaluate second votes (earliest per voter; true if candidate is mafia)
        for voter_gp_id, cand_gp_id in second_for_voter.items():
            voter_gp = gp_by_id.get(voter_gp_id)
            if not voter_gp or _is_mafia_gp(voter_gp):
                continue
            rate_denoms[voter_gp_id]["successful_contribution"] += 1
            if _is_mafia_gp(gp_by_id.get(cand_gp_id)):
                perf[voter_gp_id]["successful_contribution"] += 1


    # correct_covers_rate:
    # - cover/dialogue: per target, correct if target is citizen
    # - k_of_n_cover: per action, correct if citizen_count >= k
    # - defense: details.coverer/defense_coverer → attribute to coverer; correct if coverer is citizen
    for (ph, rn), logs in by_round_phase.items():
        if ph != "day":
            continue
        for lg in logs:
            slug = getattr(getattr(lg, "action_type", None), "slug", None)
            performer = getattr(lg, "game_player", None)
            if slug in {SLUGS["cover"], SLUGS["dialogue"]}:
                if not performer:
                    continue
                if _is_mafia_gp(performer):
                    continue
                for tid in _collect_targets(lg):
                    rate_denoms[performer.id]["correct_covers"] += 1
                    if not _is_mafia_gp(gp_by_id.get(tid)):
                        perf[performer.id]["correct_covers"] += 1
            elif slug == SLUGS["k_of_n_cover"]:
                if not performer or _is_mafia_gp(performer):
                    continue
                k = _get_k(getattr(lg, "details", {}) or {}, default=1)
                tgts = _collect_targets(lg)
                citizen_hits = sum(1 for tid in tgts if not _is_mafia_gp(gp_by_id.get(tid)))
                rate_denoms[performer.id]["correct_covers"] += 1
                if citizen_hits >= k:
                    perf[performer.id]["correct_covers"] += 1
            elif slug == SLUGS["defense"]:
                # attribute to coverer, not performer
                det = getattr(lg, "details", {}) or {}
                coverer = None
                for key in ("defense_coverer", "coverer"):
                    if key in det:
                        val = det.get(key)
                        try:
                            coverer = int(val) if isinstance(val, (int, str)) else int((val or [])[0])
                        except Exception:
                            coverer = None
                        break
                if coverer:
                    rate_denoms[coverer]["correct_covers"] += 1
                    if not _is_mafia_gp(gp_by_id.get(coverer)):
                        perf[coverer]["correct_covers"] += 1

    # successful_acts_count (Boozer, Doctor, Sniper) with No Face hijack
    # First compute raw successes by night
    success_night_role_actor: List[Tuple[int, str, int]] = []  # (night, role_slug, actor_gp_id)

    for rn in sorted({rn for (ph, rn) in by_round_phase.keys() if ph == "night"}):
        logs = by_round_phase.get(("night", rn), [])
        # Boozer success
        for lg in logs:
            if getattr(getattr(lg, "action_type", None), "slug", None) != SLUGS["boozers_shot"]:
                continue
            actor = getattr(lg, "game_player", None)
            if not actor:
                continue
            # only citizens (boozer is citizen role)
            if _is_mafia_gp(actor):
                continue
            for tid in _collect_targets(lg):
                role_slug = _safe_role_slug(gp_by_id.get(tid))
                if role_slug in {"godfather", "attorney", "killer"}:
                    success_night_role_actor.append((rn, "boozer", actor.id))

        # Doctor success: saved someone who was targeted by mafia or killer that same night
        mafia_t, killer_t, saved_t = set(), set(), set()
        for lg in logs:
            slug = getattr(getattr(lg, "action_type", None), "slug", None)
            tgts = set(_collect_targets(lg))
            if slug == SLUGS["mafia_kill"]:
                mafia_t |= tgts
            elif slug == SLUGS["killer_target"]:
                killer_t |= tgts
            elif slug == SLUGS["doctors_save"]:
                saved_t |= tgts

        saved_vs_kills = (mafia_t | killer_t) & saved_t
        if saved_vs_kills:
            # credit to the doctor(s) who saved those targets
            for lg in logs:
                if getattr(getattr(lg, "action_type", None), "slug", None) != SLUGS["doctors_save"]:
                    continue
                actor = getattr(lg, "game_player", None)
                if not actor or _is_mafia_gp(actor):
                    continue
                tgts = set(_collect_targets(lg))
                if tgts & saved_vs_kills:
                    success_night_role_actor.append((rn, "doctor", actor.id))


        # Sniper success: shot mafia
        for lg in logs:
            if getattr(getattr(lg, "action_type", None), "slug", None) != SLUGS["snipers_shot"]:
                continue
            actor = getattr(lg, "game_player", None)
            if not actor or _is_mafia_gp(actor):
                continue
            for tid in _collect_targets(lg):
                if _is_mafia_gp(gp_by_id.get(tid)):
                    success_night_role_actor.append((rn, "sniper", actor.id))

    # Apply No Face hijack rules
    # Build (night, role_slug, actor)->credited_gp
    # For each success at night N with role R in {doctor,sniper,boozer}, if a noface rule
    # exists with start_night <= N, credit to that noface instead of the actor.
    def credited_actor(night: int, role_slug: str, actor_gp_id: int) -> int:
        for start_night, noface_gp_id, roles in noface_rules:
            if night >= start_night and role_slug in roles:
                return noface_gp_id
        return actor_gp_id

    for night, role_slug, actor_gp_id in success_night_role_actor:
        dst = credited_actor(night, role_slug, actor_gp_id)
        perf[dst]["successful_acts_count"] += 1

    # ---------- MAFIA METRICS ----------
    # pushes_count (from siding/target/finalist presence → day elimination)
    # Build a quick map of day elimination victims by round
    victims_by_day: Dict[int, Set[int]] = defaultdict(set)
    for gp_id, rn in day_elims.items():
        victims_by_day[rn].add(gp_id)

    for (ph, rn), logs in by_round_phase.items():
        if ph != "day":
            continue
        # finalists set for rn
        finals = finalists_by_day.get(rn, set())
        # For fast checks
        citizen_ids = {gid for gid, gp in gp_by_id.items() if not _is_mafia_gp(gp)}

        # index mafia actors for this day’s actions
        for lg in logs:
            slug = getattr(getattr(lg, "action_type", None), "slug", None)
            actor = getattr(lg, "game_player", None)
            if not actor or not _is_mafia_gp(actor):
                continue
            aid = actor.id

            # Siding on a citizen who later is day-eliminated (any day) → push
            if slug == SLUGS["siding"]:
                for tid in _collect_targets(lg):
                    if tid in citizen_ids:
                        # If that citizen was day-eliminated at any time, count a push
                        if tid in day_elims:
                            perf[aid]["pushes_count"] += 1

            # Target on a citizen who gets eliminated the same day → push
            if slug == SLUGS["target"]:
                for tid in _collect_targets(lg):
                    if tid in citizen_ids and tid in victims_by_day.get(rn, set()):
                        perf[aid]["pushes_count"] += 1

        # If actor is finalist and anyone is day-eliminated this day → push
        if victims_by_day.get(rn):
            for mf_gp_id in finals:
                if _is_mafia_gp(gp_by_id.get(mf_gp_id)):
                    perf[mf_gp_id]["pushes_count"] += 1

    # city_trust_rate: average over days of (#coverers on this mafia / alive that day)
    for row in rows:
        gp_id = row["_gp_id"]
        if not _is_mafia_gp(gp_by_id.get(gp_id)):
            continue
        per_day_vals: List[float] = []
        for rn in day_rounds:
            logs = by_round_phase.get(("day", rn), [])
            coverers: Set[int] = set()
            for lg in logs:
                slug = getattr(getattr(lg, "action_type", None), "slug", None)
                if slug not in {SLUGS["cover"], SLUGS["k_of_n_cover"], SLUGS["dialogue"]}:
                    continue
                actor = getattr(lg, "game_player", None)
                if not actor:
                    continue
                if gp_id in _collect_targets(lg):
                    coverers.add(actor.id)
            alive = alive_at_start_of_day(rn)
            per_day_vals.append((len(coverers) / alive) if alive else 0.0)
        if per_day_vals:
            perf[gp_id]["city_trust_rate"] = sum(per_day_vals) / len(per_day_vals)
        else:
            perf[gp_id]["city_trust_rate"] = 0.0

    # successful_claim: mafia claimed a citizen role and the real holder died after the claim
    claim_logs = []
    for (ph, rn), logs in by_round_phase.items():
        for lg in logs:
            if getattr(getattr(lg, "action_type", None), "slug", None) == SLUGS["claim"]:
                claim_logs.append((ph, rn, lg))
    claim_logs.sort(key=lambda x: (x[1], 0 if x[0] == "day" else 1, *_log_sort_key(x[2])))

    # termination round lookup (any phase)
    term_round: Dict[int, int] = {}
    term_round.update(day_elims)
    term_round.update(night_elims)

    for ph, rn, lg in claim_logs:
        actor = getattr(lg, "game_player", None)
        if not actor or not _is_mafia_gp(actor):
            continue
        det = getattr(lg, "details", {}) or {}
        role_key = (det.get("role_slug") or det.get("role") or "").strip().lower()
        if not role_key:
            continue
        # find actual holder of this (citizen) role in THIS game
        holder_gp_id = None
        for gid, gp in gp_by_id.items():
            slug = (_safe_role_slug(gp) or "").lower()
            if slug == role_key and not _is_mafia_gp(gp):
                holder_gp_id = gid
                break
        if not holder_gp_id:
            continue
        # check if holder died after (>=) this claim
        hr = term_round.get(holder_gp_id)
        if hr is not None:
            # If claim on day rn and death night rn, it's "after"; if same day via voting, treat as after as well.
            perf[actor.id]["successful_claim"] = True

    # ---------- finalize to rows ----------
    for row in rows:
        gp_id = row["_gp_id"]
        # overall win-rate (DB-wide) — can be heavy; ok for small data
        try:
            row["overall_win_rate"] = _compute_overall_win_rate_for_player(row["player_id"])
        except Exception:
            row["overall_win_rate"] = 0.0

        # citizens
        if not _is_mafia_gp(gp_by_id.get(gp_id)):
            ct = perf[gp_id].get("correct_targets", 0)
            ctd = rate_denoms[gp_id].get("correct_targets", 0)
            sc = perf[gp_id].get("successful_contribution", 0)
            scd = rate_denoms[gp_id].get("successful_contribution", 0)
            cc = perf[gp_id].get("correct_covers", 0)
            ccd = rate_denoms[gp_id].get("correct_covers", 0)
            sa = perf[gp_id].get("successful_acts_count", 0)
            row["performance"] = {
                "correct_targets_rate": (ct / ctd) if ctd else 0.0,
                "successful_contribution_rate": (sc / scd) if scd else 0.0,
                "correct_covers_rate": (cc / ccd) if ccd else 0.0,
                "successful_acts_count": int(sa),
            }
        else:
            # mafia
            pushes = int(perf[gp_id].get("pushes_count", 0))
            trust = float(perf[gp_id].get("city_trust_rate", 0.0))
            sclaim = bool(perf[gp_id].get("successful_claim", False))
            row["performance"] = {
                "pushes_count": pushes,
                "city_trust_rate": trust,
                "successful_claim": sclaim,
            }


# ------------------ MAIN BUILDER ------------------
def build_game_results(game_id: int) -> Dict[str, Any]:
    game = Game.objects.get(pk=game_id)

    # Participants
    gp_qs = (
        GamePlayer.objects
        .filter(game_id=game.id)
        .select_related("player", "role")
        .order_by("seat_number", "id")
    )
    gp_by_id: Dict[int, GamePlayer] = {gp.id: gp for gp in gp_qs}
    total_players = len(gp_by_id)

    rows: List[Dict[str, Any]] = []
    for gp in gp_qs:
        rows.append({
            "player_id": gp.player_id,
            "name": getattr(gp.player, "name", str(gp.player)),
            "seat_number": getattr(gp, "seat_number", None),
            "role_name": getattr(gp.role, "name", None) if not game.is_active else None,
            "overall_win_rate": 0.0,
            "terminated_round": None,
            "terminated_phase": None,
            "performance": {},
            "_gp_id": gp.id,
            "_role_slug": getattr(gp.role, "slug", None),
            "_is_mafia": bool(getattr(gp.role, "is_mafia", False)) if gp.role else None,
        })
    row_by_gp_id = {r["_gp_id"]: i for i, r in enumerate(rows)}

    # Logs grouped by (phase, round)
    logs_qs = (
        Log.objects
        .filter(game_id=game.id)
        .select_related("action_type", "game_player", "game_player__player")
        .prefetch_related("log_targets", "log_targets__target", "log_targets__target__player")
    )
    by_round_phase: DefaultDict[Tuple[str, int], List[Log]] = defaultdict(list)
    all_rounds: Set[int] = set()
    for lg in logs_qs:
        ph = (lg.phase or "").lower()
        rn = int(getattr(lg, "round_number", 0) or 0)
        if ph in PHASES and rn >= 0:
            by_round_phase[(ph, rn)].append(lg)
            all_rounds.add(rn)

    timeline: List[Dict[str, Any]] = []

    def mark_terminated(gp_id: int, rn: int, phase: str, cause: str):
        idx = row_by_gp_id.get(gp_id)
        if idx is not None and rows[idx]["terminated_round"] is None:
            rows[idx]["terminated_round"] = rn
            rows[idx]["terminated_phase"] = phase
        timeline.append({
            "phase_type": phase,
            "round_number": rn,
            "kind": "termination",
            "payload": {
                "gp_id": gp_id,
                "player_name": getattr(gp_by_id.get(gp_id), "player", None) and gp_by_id[gp_id].player.name or "",
                "cause": cause,
            },
        })

    # Track eliminations for alive calculations
    day_elims: Dict[int, int] = {}
    night_elims: Dict[int, int] = {}
    alive_at_start_of_day = _alive_at_start_of_day_fn(total_players, day_elims, night_elims)

    # Process rounds in order: Night(r-1) → Day(r) → Night(r)
    finalists_cache: Dict[int, Set[int]] = {}
    for rn in sorted(all_rounds):
        prev_night = rn - 1
        if prev_night in all_rounds:
            night_logs = by_round_phase.get(("night", prev_night), [])
            if night_logs:
                _apply_night(prev_night, night_logs, night_elims, mark_terminated, gp_by_id)

        day_logs = by_round_phase.get(("day", rn), [])
        if day_logs:
            finalists_cache[rn] = _apply_day(rn, day_logs, alive_at_start_of_day(rn), day_elims, timeline, gp_by_id, row_by_gp_id, rows)

        night_logs = by_round_phase.get(("night", rn), [])
        if night_logs:
            _apply_night(rn, night_logs, night_elims, mark_terminated, gp_by_id)

    # Claims on timeline
    for (ph, rn), lst in sorted(by_round_phase.items()):
        for lg in sorted(lst, key=_log_sort_key):
            if getattr(getattr(lg, "action_type", None), "slug", None) == SLUGS["claim"]:
                gp = getattr(lg, "game_player", None)
                det = getattr(lg, "details", {}) or {}
                role_claimed = det.get("role_slug") or det.get("role") or None
                if gp:
                    timeline.append({
                        "phase_type": ph,
                        "round_number": rn,
                        "kind": "claim",
                        "payload": {
                            "gp_id": gp.id,
                            "player_name": getattr(gp.player, "name", ""),
                            "role_claimed": role_claimed,
                        },
                    })

    # Sniper special: if sniper died at night not by mafia/killer → citizen_fire
    for ev in timeline:
        if ev["kind"] != "termination" or ev["phase_type"] != "night":
            continue
        cause = ev["payload"].get("cause")
        if cause in ("godfather", "killer"):
            continue
        gp_id = ev["payload"]["gp_id"]
        gp = gp_by_id.get(gp_id)
        if (_safe_role_slug(gp) or "").lower() == "sniper":
            ev["payload"]["cause"] = "citizen_fire"

    # Compute metrics (fills rows[*]['performance'] & overall_win_rate)
    _compute_metrics(gp_by_id, rows, row_by_gp_id, by_round_phase, day_elims, night_elims, alive_at_start_of_day)

    # Assemble response
    meta = {
        "game_id": game.id,
        "title": game.title,
        "player_count": total_players,
        "winner": game.winner,
        "created_at": getattr(game, "created_at", None),
        "ended_at": getattr(game, "ended_at", None),
    }

    # Strip internals
    for r in rows:
        r.pop("_gp_id", None)
        r.pop("_role_slug", None)
        r.pop("_is_mafia", None)

    # Sort timeline: day (finalists → terminations → claim) then night
    order_kind = {"finalists": 0, "termination": 1, "claim": 2}
    timeline.sort(key=lambda e: (e["round_number"], 0 if e["phase_type"] == "day" else 1, order_kind.get(e["kind"], 9)))

    return {
        "meta": meta,
        "players": rows,
        "timeline": timeline,
        "links": {"full_log": f"/game-session/{game.id}"},
    }
