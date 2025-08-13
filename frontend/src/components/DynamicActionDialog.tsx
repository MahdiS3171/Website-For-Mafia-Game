import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter } from "@/components/ui/alert-dialog";
import type { ActionTypeDTO, GamePlayerResponse } from "../types";

type Props = {
  open: boolean;
  onClose: () => void;
  action: ActionTypeDTO;
  actor: GamePlayerResponse;
  players: GamePlayerResponse[];
  onConfirm: (payload: {
    targets: { target: number | string; tag?: string }[];
    details: Record<string, any>;
  }) => void;
  // roles available in this game – we’ll use for Claim and Will (dropdown)
  claimRoles?: Array<{ value: string; label: string }> | string[];
};

function normalizeTags(tags?: (string | { key: string; label: string })[]) {
  if (!tags || tags.length === 0) return [] as { key: string; label: string }[];
  return tags.map((t) =>
    typeof t === "string" ? { key: t, label: t.charAt(0).toUpperCase() + t.slice(1) } : t
  );
}

export default function DynamicActionDialog({
  open,
  onClose,
  action,
  actor,
  players,
  onConfirm,
  claimRoles = [],
}: Props) {
  const cfg = action?.config || {};

  // Intent flags
  const isClaim =
    action.slug === "claim" ||
    (cfg?.requires_targets === false && !!cfg?.details_schema?.role_slug);

  const isVote =
    action.slug === "first_vote" ||
    action.slug === "second_vote" ||
    !!(cfg as any)?.derive_n_from_targets;

  const isWill =
    action.slug === "will" ||
    (!!cfg?.details_schema &&
      ("target" in cfg.details_schema || "cover" in cfg.details_schema || "claim_role" in cfg.details_schema));

  // “Cover for defense” (extended defense)
  const isDefenseExtended =
    !!cfg?.details_schema &&
    ("coverer" in cfg.details_schema || "targets" in cfg.details_schema || "covered" in cfg.details_schema);

  // Show players grid only if the action needs targets and it’s not claim
  const showTargetsGrid = !!cfg?.requires_targets && !isClaim && !isWill && !isDefenseExtended;

  // Params visibility
  const showKInput = !!cfg?.params?.k;
  const showNInput = !!cfg?.params?.n && !isVote && !(cfg as any)?.derive_n_from_targets;

  // Tag metadata
  const tags = normalizeTags(cfg.tags);
  // Terror = one selected per tag
  const singlePerTag = (cfg as any).single_per_tag === true || action.slug === "terror";

  const allowSelf = cfg.allow_self ?? false;

  // Params state
  const [k, setK] = useState<number | undefined>(undefined);
  const [n, setN] = useState<number | undefined>(undefined);

  // Claim / Will role
  const [roleSlug, setRoleSlug] = useState<string>("");

  // Will (multi)
  const [willTargets, setWillTargets] = useState<(string | number)[]>([]);
  const [willCovers, setWillCovers] = useState<(string | number)[]>([]);
  const [willClaimRole, setWillClaimRole] = useState<string>("");

  // Defense extended
  const [defCoverer, setDefCoverer] = useState<string | number | undefined>(undefined);
  const [defTargets, setDefTargets] = useState<(string | number)[]>([]);
  const [defCovered, setDefCovered] = useState<(string | number)[]>([]);

  // Buckets for regular tagged/flat picking
  // For tagged buckets, we’ll store arrays but enforce single for terror
  const [bucketTargets, setBucketTargets] = useState<Record<string, (string | number)[]>>({
    __flat__: [],
  });

  const roleOptions = useMemo(
    () =>
      (Array.isArray(claimRoles) ? claimRoles : []).map((r: any) =>
        typeof r === "string" ? { value: r, label: r } : r
      ),
    [claimRoles]
  );

  useEffect(() => {
    if (open) {
      setK(undefined);
      setN(undefined);
      setRoleSlug("");
      setWillTargets([]);
      setWillCovers([]);
      setWillClaimRole("");
      setDefCoverer(undefined);
      setDefTargets([]);
      setDefCovered([]);
      setBucketTargets({ __flat__: [] });
    }
  }, [open]);

  const actorId = actor?.id;

  const title = useMemo(() => {
    if (isWill) return "Will";
    if (isDefenseExtended) return action.name;
    if (tags.length > 0) return action.name;
    if (cfg.params?.k && cfg.params?.n)
      return `Select ${n ?? "…"} players for the ${k ?? "…"} out of ${n ?? "…"} ${action.name}`;
    if (!tags.length && cfg.requires_targets && !cfg.params) {
      const label = (cfg.item_label || "player") + (cfg.item_label?.endsWith("s") ? "" : "s");
      return `Select ${label} for ${action.name}`;
    }
    return action.name;
  }, [action.name, cfg.params, cfg.item_label, k, n, tags.length, isWill, isDefenseExtended]);

  const canPick = (pid: string | number) => allowSelf || String(pid) !== String(actorId);

  // Toggle a pick inside a bucket; enforce single for terror (singlePerTag)
  const addToBucket = (bucketKey: string, pid: string | number) => {
    if (!canPick(pid)) return;
    setBucketTargets((prev) => {
      const current = prev[bucketKey] ?? [];
      if (singlePerTag && bucketKey !== "__flat__") {
        // keep exactly one for this tag
        const next = current.includes(pid) ? [] : [pid];
        return { ...prev, [bucketKey]: next };
      }
      // multi-toggle
      const set = new Set(current);
      if (set.has(pid)) set.delete(pid);
      else set.add(pid);
      return { ...prev, [bucketKey]: Array.from(set) };
    });
  };

  const toggleList = (list: (string | number)[], pid: string | number) => {
    const s = new Set(list);
    if (s.has(pid)) s.delete(pid);
    else s.add(pid);
    return Array.from(s);
  };

  const buildPayload = () => {
    const details: Record<string, any> = {};
    const targets: { target: number | string; tag?: string }[] = [];

    // --- CLAIM (role only)
    if (isClaim) {
      if (!roleSlug || String(roleSlug).trim() === "") {
        alert("Please choose a role.");
        return { details: {}, targets: [] };
      }
      details.role_slug = roleSlug;
      return { details, targets: [] };
    }

    // --- WILL (multi targets & covers + dropdown role)
    if (isWill) {
      details.target = (willTargets ?? []).map(String);
      details.cover = (willCovers ?? []).map(String);
      if (willClaimRole) details.claim_role = willClaimRole;
      return { details, targets: [] }; // single log, no explicit targets array
    }

    // --- DEFENSE EXTENDED (coverer single, targets multi, covered multi)
    if (isDefenseExtended) {
      if (defCoverer) details.coverer = String(defCoverer);
      if (defTargets?.length) details.targets = defTargets.map(String);
      if (defCovered?.length) details.covered = defCovered.map(String);
      return { details, targets: [] };
    }

    // --- k-of-n params (only store what we actually show)
    if (showKInput) details.k = k;
    if (showNInput) details.n = n; // votes hide this; server derives n

    // --- Tagged picks (terror, killer, etc.)
    if (tags.length > 0) {
      for (const tag of tags) {
        const arr = bucketTargets[tag.key] ?? [];
        const first = arr[0]; // one per tag (UI enforces if singlePerTag)
        if (first) targets.push({ target: first, tag: tag.key });
      }
    } else {
      // flat bucket (siding / votes / generic multi)
      const list = bucketTargets.__flat__ ?? [];
      for (const pid of list) targets.push({ target: pid });
    }

    // --- Votes: always set n = number of picks (harmless if server already derives)
    if (isVote || (cfg as any).derive_n_from_targets) {
      details.n = targets.length;
    }

    return { details, targets };
  };

  const handleConfirm = () => {
    const { details, targets } = buildPayload();
    onConfirm({ details, targets });
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent className="max-w-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
        </AlertDialogHeader>

        <div className="space-y-4 max-h-[56vh] overflow-auto pr-1">
          {/* CLAIM / WILL / DEFENSE-EXTENDED custom UIs */}
          {isWill && (
            <div className="space-y-4">
              <div className="border rounded-2xl p-3">
                <div className="font-medium mb-2">Targets</div>
                <div className="flex flex-wrap gap-2">
                  {players.map((p) => (
                    <Badge
                      key={`will-t-${p.id}`}
                      variant={willTargets.includes(p.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setWillTargets((prev) => toggleList(prev, p.id))}
                    >
                      {p.seat_number}. {p.player}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="border rounded-2xl p-3">
                <div className="font-medium mb-2">Covers</div>
                <div className="flex flex-wrap gap-2">
                  {players.map((p) => (
                    <Badge
                      key={`will-c-${p.id}`}
                      variant={willCovers.includes(p.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setWillCovers((prev) => toggleList(prev, p.id))}
                    >
                      {p.seat_number}. {p.player}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Role dropdown same as Claim */}
              <div>
                <div className="font-medium mb-2">Claimed role (optional)</div>
                {roleOptions.length > 0 ? (
                  <select
                    className="border rounded-md px-3 py-2 w-full"
                    value={willClaimRole}
                    onChange={(e) => setWillClaimRole(e.target.value)}
                  >
                    <option value="">(none)</option>
                    {roleOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={willClaimRole}
                    onChange={(e) => setWillClaimRole(e.target.value)}
                    placeholder="role"
                    className="border rounded-md px-3 py-2 w-full"
                  />
                )}
              </div>
            </div>
          )}

          {isDefenseExtended && (
            <div className="space-y-4">
              <div className="border rounded-2xl p-3">
                <div className="font-medium mb-2">Covering player</div>
                <div className="flex flex-wrap gap-2">
                  {players.map((p) => (
                    <Badge
                      key={`def-cov-${p.id}`}
                      variant={String(defCoverer) === String(p.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setDefCoverer(String(p.id) === String(defCoverer) ? undefined : p.id)}
                    >
                      {p.seat_number}. {p.player}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-2xl p-3">
                  <div className="font-medium mb-2">Targeted players</div>
                  <div className="flex flex-wrap gap-2">
                    {players.map((p) => (
                      <Badge
                        key={`def-tar-${p.id}`}
                        variant={defTargets.includes(p.id) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setDefTargets((prev) => toggleList(prev, p.id))}
                      >
                        {p.seat_number}. {p.player}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="border rounded-2xl p-3">
                  <div className="font-medium mb-2">Covered players</div>
                  <div className="flex flex-wrap gap-2">
                    {players.map((p) => (
                      <Badge
                        key={`def-covd-${p.id}`}
                        variant={defCovered.includes(p.id) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setDefCovered((prev) => toggleList(prev, p.id))}
                      >
                        {p.seat_number}. {p.player}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tagged pickers (terror / killer / etc.) */}
          {!isWill && !isDefenseExtended && tags.length > 0 && (
            <div className="grid md:grid-cols-2 gap-4">
              {tags.map((t) => (
                <div key={t.key} className="border rounded-2xl p-3">
                  <div className="font-medium mb-2">{t.label}</div>
                  <div className="flex flex-wrap gap-2">
                    {players.map((p) => (
                      <Badge
                        key={`${t.key}-${p.id}`}
                        variant={(bucketTargets[t.key] ?? []).includes(p.id) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => addToBucket(t.key, p.id)}
                      >
                        {p.seat_number}. {p.player}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Flat bucket (siding / k-of-n / votes) */}
          {!isWill && !isDefenseExtended && tags.length === 0 && showTargetsGrid && (
            <div className="border rounded-2xl p-3">
              <div className="font-medium mb-2">{cfg.item_label ?? "Select players"}</div>
              <div className="flex flex-wrap gap-2">
                {players.map((p) => (
                  <Badge
                    key={p.id}
                    variant={(bucketTargets.__flat__ ?? []).includes(p.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => addToBucket("__flat__", p.id)}
                  >
                    {p.seat_number}. {p.player}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Params (k,n) */}
          {(cfg.params?.k || cfg.params?.n) && (
            <div className="flex gap-4">
              {cfg.params?.k && (
                <input
                  type="number"
                  min={cfg.params.k.min ?? 1}
                  value={k ?? ""}
                  onChange={(e) => setK(parseInt(e.target.value || "0", 10) || undefined)}
                  placeholder="k"
                  className="border rounded-md px-3 py-2 w-24"
                />
              )}
              {cfg.params?.n && showNInput && (
                <input
                  type="number"
                  min={cfg.params.n.min ?? 1}
                  value={n ?? ""}
                  onChange={(e) => setN(parseInt(e.target.value || "0", 10) || undefined)}
                  placeholder="n"
                  className="border rounded-md px-3 py-2 w-24"
                />
              )}
            </div>
          )}

          {/* Claim role dropdown (pure claim) */}
          {!isWill && isClaim && (
            <div>
              <div className="font-medium mb-2">Choose role</div>
              {roleOptions.length > 0 ? (
                <select
                  className="border rounded-md px-3 py-2 w-full"
                  value={roleSlug ?? ""}
                  onChange={(e) => setRoleSlug(e.target.value)}
                >
                  <option value="" disabled>
                    (select a role)
                  </option>
                  {roleOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={roleSlug}
                  onChange={(e) => setRoleSlug(e.target.value)}
                  placeholder="role"
                  className="border rounded-md px-3 py-2 w-full"
                />
              )}
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Confirm</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
