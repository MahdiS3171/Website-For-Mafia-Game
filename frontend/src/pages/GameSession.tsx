import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Users, Clock, ArrowRight } from "lucide-react";
import { startTurn, endTurn, getCurrentTurn, getGames, getPhasesByGame } from "../lib/api";
import DynamicActionDialog from "@/components/DynamicActionDialog";
import type { ActionTypeDTO, GamePlayerResponse } from "../types";
import { Trash2 } from "lucide-react";
import { deleteLog as apiDeleteLog } from "../lib/api";

import {
  getGameDetails,
  getLogsByGame,
  completeGame,
  createLog,
  getActionTypes,
  advancePhase,
  terminatePlayers,
} from "../lib/api";
import { NestedPlayer, LogResponse } from "../types";

const GameSession = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [players, setPlayers] = useState<NestedPlayer[]>([]);
  const [logs, setLogs] = useState<LogResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openTurn, setOpenTurn] = useState<{
    id: string | number;
    index: number;
    actorId: string | number;
    actorName?: string;
  } | null>(null);
  // selection state
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  // phase/round
  const [currentPhase, setCurrentPhase] = useState<"Day" | "Night">("Day");
  const [round, setRound] = useState(1);
  // elimination modal
  const [showElimination, setShowElimination] = useState(false);
  const [toEliminate, setToEliminate] = useState<string[]>([]);
  // New: data-driven actions + dialog
  const [actionTypes, setActionTypes] = useState<ActionTypeDTO[]>([]);
  const [chosenAction, setChosenAction] = useState<ActionTypeDTO | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  // --- Will queue flow (show a Will dialog for each eliminated player)
  const [willQueue, setWillQueue] = useState<GamePlayerResponse[]>([]);
  const [processingWills, setProcessingWills] = useState(false);
  const [deleteLogId, setDeleteLogId] = useState<string | number | null>(null);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [winnerChoice, setWinnerChoice] = useState<"Mafia" | "Citizen">("Mafia");
  const [pendingWill, setPendingWill] = useState<number | null>(null);

  // ActionType reference for 'will'
  const willAction = useMemo(
    () => actionTypes.find((a) => a.slug === "will") || null,
    [actionTypes]
  );

  // Roles in this game (for claim & will dropdown)

  // re-usable: advance phase and refresh
  const doAdvancePhase = async () => {
    const phaseRes = (await advancePhase(gameId!)) as { data: { current_phase: string; round_number: number } };
    const [gameRes, logsRes] = await Promise.all([getGameDetails(gameId!), getLogsByGame(gameId!)]);
    setPlayers(gameRes.data.players);
    setLogs(logsRes.data);

    const nextPhaseName = phaseRes.data.current_phase === "day" ? "Day" : "Night";
    setCurrentPhase(nextPhaseName);
    setRound(phaseRes.data.round_number);

    setChosenAction(null);
    setActionDialogOpen(false);
    setSelectedPlayer(null);

    setShowElimination(false);
    setToEliminate([]);

    toast({ title: "Phase Changed", description: `Now entering ${phaseRes.data.current_phase} phase` });
  };


  // === Fetch game, players, logs ===
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!gameId) return;

        const [gameRes, logsRes] = await Promise.all([getGameDetails(gameId), getLogsByGame(gameId)]);
        setPlayers(gameRes.data.players);
        setLogs(logsRes.data);

        if (gameRes.data.current_phase) {
          setCurrentPhase(gameRes.data.current_phase === "day" ? "Day" : "Night");
        }
        if (gameRes.data.round_number) {
          setRound(gameRes.data.round_number);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [gameId]);

  // Fetch action types once
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await getActionTypes();   // <— now returns ActionTypeDTO[]
        if (mounted) setActionTypes(list);
      } catch {/* ignore */}
    })();
    return () => { mounted = false; };
  }, []);

  // Clear any half-picked action when phase changes
  useEffect(() => {
    setChosenAction(null);
    setActionDialogOpen(false);
    setOpenTurn(null);
    setSelectedPlayer(null);
  }, [currentPhase]);

  useEffect(() => {
    (async () => {
      if (!gameId) return;
      try {
        const res = await getCurrentTurn(gameId);
        const dt = (res as any)?.data;
        if (dt && dt.id) {
          setOpenTurn({ id: dt.id, index: dt.index, actorId: dt.actor, actorName: dt.actor_name });
          setSelectedPlayer(String(dt.actor));
        }
      } catch {}
    })();
  }, [gameId]);

  // Helpers
  const currentPhaseLower = useMemo(() => currentPhase.toLowerCase() as "day" | "night", [currentPhase]);
  const alivePlayers = useMemo(() => players.filter((p: any) => !p.is_eliminated), [players]);

  // The dialog expects player objects with a "player" field for the name; map it from "name"
  const dialogPlayers: GamePlayerResponse[] = useMemo(
    () =>
      alivePlayers.map((p: any) => ({
        ...p,
        player: p.name,
      })) as unknown as GamePlayerResponse[],
    [alivePlayers]
  );

  const selectedActorObj: GamePlayerResponse | null = useMemo(() => {
    if (!selectedPlayer) return null;
    const p = players.find((x) => String(x.id) === String(selectedPlayer));
    return p ? ({ ...p, player: p.name } as any as GamePlayerResponse) : null;
  }, [players, selectedPlayer]);

  const claimRoleOptions = useMemo(
    () => {
      const seen = new Set<string>();
      const out: { value: string; label: string }[] = [];
      players.forEach((p: any) => {
        const raw = (p.role ?? "").trim();
        if (!raw) return;
        const key = raw.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          out.push({ value: raw, label: raw }); // value = what backend will validate against
        }
      });
      return out;
    },
    [players]
  );

  const recentLogs = useMemo(() => {
    // Show only logs for the current round/day, newest first; take last 12
    const roundNow = round;
    const list = [...logs]
      .filter(l => Number(l.round_number) === Number(roundNow) && String(l.phase).toLowerCase() === currentPhaseLower)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return list.slice(0, 12);
  }, [logs, round, currentPhaseLower]);


  // Player click: pick the actor
  const handlePlayerClick = (playerId: string) => {
    if (openTurn && String(openTurn.actorId) !== String(playerId)) {
      toast({
        title: "Turn in progress",
        description: "End the current turn before switching actor.",
        variant: "destructive",
      });
      return;
    }
    // If clicking the same player, toggle off
    if (selectedPlayer && String(selectedPlayer) === String(playerId)) {
      setSelectedPlayer(null);
      setChosenAction(null);
      setActionDialogOpen(false);
      return;
    }
    setSelectedPlayer(playerId);
  };

  // When user clicks an action button
  const handleActionClick = (action: ActionTypeDTO) => {
    if (!selectedPlayer) {
      toast({
        title: "Pick a player first",
        description: "Select the actor before choosing an action.",
        variant: "destructive",
      });
      return;
    }
    if (action.phase !== currentPhaseLower) {
      toast({
        title: "Phase mismatch",
        description: `“${action.name}” is for ${action.phase}.`,
        variant: "destructive",
      });
      return;
    }
    setChosenAction(action);
    setActionDialogOpen(true);
  };

  // Confirm from dialog → create log(s)
  const handleConfirmAction = async ({
    targets,
    details,
  }: {
    targets: { target: number | string; tag?: string }[];
    details: Record<string, any>;
  }) => {
    if (!gameId || !selectedActorObj || !chosenAction) return;
    const actionTypeField = chosenAction.slug;
    // Respect separate_per_target if present (fallback to separatePerTarget)
    const cfg = chosenAction.config || {};
    const separatePerTarget =
      (cfg as any).separate_per_target ?? (cfg as any).separatePerTarget ?? false;

    try {
      if (separatePerTarget && targets.length > 1) {
        // one log per picked target (for your fling/target/cover behavior)
        for (const t of targets) {
          await createLog({
            game: gameId!,
            game_player: (selectedActorObj as any).id,
            action_type: actionTypeField,
            targets: [{ target: String(t.target), tag: t.tag }],  // <— wrap in String()
            phase: currentPhaseLower,
            round_number: round,
            details,
          });
        }
      } else {
        await createLog({
          game: gameId!,
          game_player: (selectedActorObj as any).id,
          action_type: actionTypeField,
          targets: targets.map(x => ({ target: String(x.target), tag: x.tag })), // <— String()
          phase: currentPhaseLower,
          round_number: round,
          details,
          ...(openTurn ? { day_turn: openTurn.id } : {}), 
        });
      }

      toast({
        title: "Action Logged",
        description: `${chosenAction.name} recorded for ${
          (selectedActorObj as any).name || (selectedActorObj as any).player
        }`,
      });

      // Refresh data
      const [logsRes, gameRes] = await Promise.all([getLogsByGame(gameId!), getGameDetails(gameId!)]);
      setLogs(logsRes.data);
      setPlayers(gameRes.data.players);

      // --- If we're processing Will queue, move to the next actor or advance phase ---
      if (processingWills && chosenAction?.slug === "will") {
        if (willQueue.length > 0) {
          const [next, ...rest] = willQueue;
          setWillQueue(rest);
          setSelectedPlayer(String(next.id));
          setChosenAction(willAction!);
          setActionDialogOpen(true);
        } else {
          setProcessingWills(false);
          // Now advance phase after collecting all wills
          await doAdvancePhase();
        }
        return; // prevent the default closing/reset below
      }

    } catch (e: any) {
      const msg = e?.response?.data ? JSON.stringify(e.response.data) : e?.message || String(e);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      // Always close and clear selection after logging
      setActionDialogOpen(false);
      setChosenAction(null);
    }
  };

  // Next phase opens elimination modal
  const nextPhase = async () => {
    setShowElimination(true);
  };

  const confirmEliminationsAndAdvance = async () => {
    if (!gameId) return;
    try {
      const eliminatedIds = toEliminate.slice();

      if (eliminatedIds.length > 0) {
        // mark them terminated first
        await terminatePlayers(gameId, eliminatedIds);
      }
      // If there are eliminations and we have the Will action configured,
      // start the Will wizard (one-by-one), THEN advance phase.
      if (eliminatedIds.length > 0 && willAction) {
        const queue = players
          .filter((p: any) => eliminatedIds.includes(String(p.id)))
          .map(
            (p: any) =>
              ({ ...p, player: p.name } as any as GamePlayerResponse) // dialog expects .player field
          );

        if (queue.length > 0) {
          setProcessingWills(true);
          // open the first Will
          const [first, ...rest] = queue;
          setWillQueue(rest);
          setSelectedPlayer(String(first.id));
          setChosenAction(willAction);
          setActionDialogOpen(true);
          setShowElimination(false);
          return;
        }
      }

      await doAdvancePhase();
      
    } catch (e: any) {
      const msg = e?.response?.data ? JSON.stringify(e.response.data) : e?.message || String(e);
      toast({
        title: "Error",
        description: `Failed to confirm eliminations / advance phase: ${msg}`,
        variant: "destructive",
      });
    }
  };


  const handleConfirmEndGame = async () => {
    if (!gameId) return;
    try {
      await completeGame(gameId, winnerChoice); // sends exactly "Mafia" or "Citizen"
      toast({ title: "Game Completed", description: `Winner: ${winnerChoice}` });
      setShowEndDialog(false);
      const RESULTS_PATH = `/results/${gameId}`;
      navigate(RESULTS_PATH);
    } catch (err: any) {
      const description = err?.response?.data ? JSON.stringify(err.response.data) : err?.message || "Failed to end game";
      toast({ title: "Error", description, variant: "destructive" });
    }
  };

  // start/ end handlers
  const handleStartTurn = async () => {
    if (!gameId || !selectedPlayer || currentPhaseLower !== "day") {
      toast({ title: "Turns are Day-only", description: "Pick an actor during Day to start.", variant: "destructive" });
      return;
    }
    try {
      const res = await startTurn(gameId, selectedPlayer);
      const dt = res.data;
      setOpenTurn({ id: dt.id, index: dt.index, actorId: dt.actor, actorName: dt.actor_name });
      // lock actor
      setSelectedPlayer(String(dt.actor));
      toast({ title: "Turn started", description: `Day ${round}, Turn #${dt.index} — ${dt.actor_name ?? "player"}` });
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.message || "Failed to start turn";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  const handleEndTurn = async () => {
    if (!openTurn) return;
    try {
      await endTurn(openTurn.id);
      toast({ title: "Turn ended", description: `Turn #${openTurn.index} closed.` });
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.message || "Failed to end turn";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setOpenTurn(null);
      setSelectedPlayer(null);
    }
  };

  // Build a tag label map for a given action slug using actionTypes config
  const getTagLabelMap = (slug: string) => {
    const at = actionTypes.find(a => a.slug === slug);
    const tags = (at?.config as any)?.tags ?? [];
    const map: Record<string, string> = {};
    if (Array.isArray(tags)) {
      for (const t of tags) {
        if (typeof t === "string") {
          const label = t.charAt(0).toUpperCase() + t.slice(1);
          map[t] = label;
        } else if (t && typeof t === "object" && t.key) {
          map[t.key] = t.label ?? (t.key.charAt(0).toUpperCase() + t.key.slice(1));
        }
      }
    }
    return map;
  };

  const nameOf = (gpId?: string | number) =>
    gpId == null ? "" : (players.find(p => String(p.id) === String(gpId))?.name ?? `#${gpId}`);

  const seatOf = (gpId?: string | number) => {
    const p = players.find(x => String(x.id) === String(gpId));
    return p?.seat_number ?? undefined;
  };

  const actionName = (slug: string) =>
    actionTypes.find(a => a.slug === slug)?.name ?? slug.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  // Format a list of player ids as "S{seat}. Name"
  const fmtList = (ids: (string|number)[]) =>
    ids.map(id => {
      const seat = seatOf(id);
      const nm = nameOf(id);
      return seat != null ? `S${seat}. ${nm}` : nm;
    }).join(", ");

  // Turn label: Day X — Turn #Y (if present)
  const turnLabel = (log: LogResponse) =>
    typeof (log as any).turn_index === "number"
      ? `Day ${log.round_number} — Turn #${(log as any).turn_index}`
      : `Day ${log.round_number}${log.phase ? ` (${log.phase})` : ""}`;



  const renderDetails = (log: LogResponse) => {
    const slug = log.action_type as string;
    const tagLabel = getTagLabelMap(slug);
    const tgt = (log as any).targets as Array<{ target: string|number; tag?: string; player_name?: string }> | undefined;
    const d = (log as any).details || {};

    // 1) Multi-target actions with explicit tags (terror, killer_target, etc.)
    if (Array.isArray(tgt) && tgt.length) {
      return (
        <div className="flex flex-wrap gap-1">
          {tgt.map((t, idx) => {
            const lbl = t.tag ? (tagLabel[t.tag] ?? (t.tag.charAt(0).toUpperCase() + t.tag.slice(1))) : "Target";
            const seat = seatOf(t.target);
            const nm = nameOf(t.target);
            return (
              <Badge key={idx} variant="outline">
                {lbl}: {seat != null ? `S${seat}. ` : ""}{nm}
              </Badge>
            );
          })}
        </div>
      );
    }

    // 2) Claim
    if (slug === "claim" && d?.role_slug) {
      return <span>Claims <Badge>{String(d.role_slug)}</Badge></span>;
    }

    // 3) Will (arrays; empty allowed)
    if (slug === "will") {
      const targets = Array.isArray(d?.targets) ? d.targets : [];
      const covers = Array.isArray(d?.covers) ? d.covers : [];
      const role = d?.claim_role ? String(d.claim_role) : null;
      return (
        <div className="space-y-1">
          <div><span className="font-medium">Targets:</span> {targets.length ? fmtList(targets) : <em>—</em>}</div>
          <div><span className="font-medium">Covers:</span> {covers.length ? fmtList(covers) : <em>—</em>}</div>
          <div><span className="font-medium">Role:</span> {role ? role : <em>—</em>}</div>
        </div>
      );
    }

    // 4) Defense (coverer + targets + covered; optional)
    if (slug === "defense") {
      const coverer = d?.defense_coverer;
      const defTargets = Array.isArray(d?.defense_targets) ? d.defense_targets : [];
      const defCovered = Array.isArray(d?.defense_covered) ? d.defense_covered : [];
      return (
        <div className="space-y-1">
          <div><span className="font-medium">Covering player:</span> {coverer ? fmtList([coverer]) : <em>—</em>}</div>
          <div><span className="font-medium">Def. targets:</span> {defTargets.length ? fmtList(defTargets) : <em>—</em>}</div>
          <div><span className="font-medium">Covered:</span> {defCovered.length ? fmtList(defCovered) : <em>—</em>}</div>
        </div>
      );
    }

    // 5) Votes
    if (slug === "first_vote" || slug === "second_vote") {
      const voters = Array.isArray(d?.voters) ? d.voters : (Array.isArray(d?.targets) ? d.targets : []);
      const n = typeof d?.n === "number" ? d.n : (voters?.length ?? 0);
      return (
        <div className="space-x-2">
          <Badge variant="outline">n = {n}</Badge>
          <span>Voters: {Array.isArray(voters) && voters.length ? fmtList(voters) : <em>—</em>}</span>
        </div>
      );
    }

    // 6) k-of-n
    if (slug === "k_of_n_target" || slug === "k_of_n_cover") {
      const k = d?.k, n = d?.n;
      const chosen = Array.isArray(d?.targets) ? d.targets : [];
      return (
        <div className="space-x-2">
          <Badge variant="outline">k = {k ?? "?"}</Badge>
          <Badge variant="outline">n = {n ?? (Array.isArray(chosen) ? chosen.length : "?")}</Badge>
          <span>Chosen: {Array.isArray(chosen) && chosen.length ? fmtList(chosen) : <em>—</em>}</span>
        </div>
      );
    }

    return <em>No details</em>;
  };

  const confirmDeleteLog = async () => {
    if (!deleteLogId) return;
    try {
      await apiDeleteLog(deleteLogId);
      setLogs(prev => prev.filter(l => String(l.id) !== String(deleteLogId)));
      toast({ title: "Log deleted" });
    } catch (e: any) {
      const msg = e?.response?.data ? JSON.stringify(e.response.data) : e?.message || "Failed to delete log";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setDeleteLogId(null);
    }
  };




  const getRoleColor = (role?: string) => {
    switch (role?.toLowerCase()) {
      case "mafia":
        return "bg-red-100 text-red-800 border-red-200";
      case "detective":
      case "sheriff":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "doctor":
        return "bg-green-100 text-green-800 border-green-200";
      case "citizen":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-purple-100 text-purple-800 border-purple-200";
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading game session...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">Failed to load game: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <Link
            to="/games"
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Games
          </Link>

          <Button variant="destructive" onClick={() => setShowEndDialog(true)}>
            End Game
          </Button>
        </div>

        {/* Game Status */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">Game #{gameId}</CardTitle>
                <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    Round {round}
                  </span>
                  <span className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {players.length} players
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-lg px-4 py-2">
                  {currentPhase} Phase
                </Badge>
                {currentPhase === "Day" && openTurn && (
                  <Badge variant="outline" className="px-3 py-1">
                    Day {round} — Turn #{openTurn.index} (Actor: {players.find(p => String(p.id) === String(openTurn.actorId))?.name ?? openTurn.actorName ?? "Player"})
                  </Badge> 
                )}
                <Button onClick={nextPhase} className="flex items-center gap-2">
                  Next Phase <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Actions Grid */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle>Recent actions</CardTitle>
              <div className="text-xs text-muted-foreground">
                Showing latest for {currentPhase} / Day {round}. (We can add filters later.)
              </div>
            </CardHeader>
            <CardContent>
              {recentLogs.length === 0 ? (
                <div className="text-sm text-muted-foreground">No actions logged yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left">
                      <tr className="border-b">
                        <th className="py-2 pr-2 w-10 align-middle" /> {/* trash */}
                        <th className="py-2 pr-4 align-middle">Actor</th>
                        <th className="py-2 pr-4 align-middle">Turn</th>
                        <th className="py-2 pr-4 align-middle">Action</th>
                        <th className="py-2 align-middle">Details / Targets</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentLogs.map((log) => {
                        const actorSeat = seatOf(log.game_player);
                        const actorName = (log as any).player_name ?? nameOf(log.game_player);
                        return (
                          <tr key={log.id} className="border-b last:border-b-0 align-top">
                            <td className="py-2 pr-2 align-middle">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-600"
                                onClick={() => setDeleteLogId(log.id)}
                                aria-label="Delete log"
                                title="Delete log"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                            <td className="py-2 pr-4 whitespace-nowrap align-middle">
                              {actorSeat != null ? `S${actorSeat}. ` : ""}{actorName}
                            </td>
                            <td className="py-2 pr-4 whitespace-nowrap align-middle">{turnLabel(log)}</td>
                            <td className="py-2 pr-4 whitespace-nowrap align-middle">{actionName(log.action_type)}</td>
                            <td className="py-2 align-middle">{renderDetails(log)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Players Grid */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Players</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {alivePlayers.map((player) => (
                    <Card
                      key={player.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        String(selectedPlayer) === String(player.id) ? "ring-2 ring-primary shadow-lg" : ""
                      }`}
                      onClick={() => handlePlayerClick(String(player.id))}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="mb-2">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="font-bold text-lg">{player.seat_number}</span>
                          </div>
                          <h3 className="font-semibold text-sm">{player.name}</h3>
                        </div>
                        <Badge className={getRoleColor(player.role)}>{player.role || "Unknown"}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Panel */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedPlayer ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-secondary rounded-lg">
                      <p className="text-sm font-medium">Selected Player:</p>
                      <p className="text-lg">
                        {players.find((p) => String(p.id) === String(selectedPlayer))?.name}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {currentPhase === "Day" && !openTurn && selectedPlayer && (
                        <Button onClick={handleStartTurn}>Start Turn</Button>
                      )}
                      {currentPhase === "Day" && openTurn && (
                        <Button variant="secondary" onClick={handleEndTurn}>End Turn</Button>
                      )}
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Available Actions:</h4>
                      {actionTypes.length === 0 && (
                        <div className="text-sm text-muted-foreground">
                          No actions configured. (Make sure /actions/types/ is seeded.)
                        </div>
                      )}
                      {actionTypes
                        .filter((a) => a.phase === currentPhaseLower)
                        .map((action) => (
                          <Button
                            key={action.slug}
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => handleActionClick(action)}
                          >
                            {action.name}
                          </Button>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Select a player to view available actions</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Elimination modal */}
        <AlertDialog open={showElimination} onOpenChange={setShowElimination}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Select eliminated players for this phase</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="space-y-2 max-h-64 overflow-auto">
              {alivePlayers.map((p) => (
                <label key={p.id} className="flex items-center gap-2 py-1">
                  <Checkbox
                    checked={toEliminate.includes(String(p.id))}
                    onCheckedChange={(checked) => {
                      const id = String(p.id);
                      setToEliminate((prev) =>
                        checked === true ? Array.from(new Set([...prev, id])) : prev.filter((x) => x !== id)
                      );
                    }}
                  />
                  <span>{p.name}</span>
                </label>
              ))}
            </div>
            <AlertDialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setShowElimination(false)}>
                Cancel
              </Button>
              <Button onClick={confirmEliminationsAndAdvance}>Confirm & Next Phase</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={deleteLogId != null} onOpenChange={(o) => !o && setDeleteLogId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this action?</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="text-sm text-muted-foreground">
              This will permanently remove the log from the game history.
            </div>
            <AlertDialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setDeleteLogId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={confirmDeleteLog}>Delete</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>End game — choose the winning side</AlertDialogTitle>
            </AlertDialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-2 border rounded-md p-3 cursor-pointer">
                  <input
                    type="radio"
                    name="winner"
                    value="Mafia"
                    checked={winnerChoice === "Mafia"}
                    onChange={() => setWinnerChoice("Mafia")}
                    className="accent-current"
                  />
                  <span>Mafia</span>
                </label>
                <label className="flex items-center gap-2 border rounded-md p-3 cursor-pointer">
                  <input
                    type="radio"
                    name="winner"
                    value="Citizen"
                    checked={winnerChoice === "Citizen"}
                    onChange={() => setWinnerChoice("Citizen")}
                    className="accent-current"
                  />
                  <span>Citizen</span>
                </label>
              </div>

              <div className="text-sm text-muted-foreground">
                This action will finalize the game and move it to the results list.
              </div>
            </div>

            <AlertDialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setShowEndDialog(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleConfirmEndGame}>
                End Game
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>


        {/* Dynamic action dialog */}
        {chosenAction && selectedActorObj && (
          <DynamicActionDialog
            open={actionDialogOpen}
            onClose={() => setActionDialogOpen(false)}
            action={chosenAction}
            actor={selectedActorObj}
            players={dialogPlayers}
            claimRoles={claimRoleOptions}
            onConfirm={handleConfirmAction}
          />
        )}
      </div>
    </div>
  );
};

export default GameSession;
