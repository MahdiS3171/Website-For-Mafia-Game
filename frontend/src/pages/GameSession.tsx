import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Users, Clock, ArrowRight } from "lucide-react";

import { getGameDetails, getLogsByGame, completeGame, createLog, getActionTypes, advancePhase, terminatePlayers } from "../lib/api";
import { NestedPlayer, LogResponse } from "../types";


const GameSession = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { toast } = useToast();

  const [players, setPlayers] = useState<NestedPlayer[]>([]);
  const [logs, setLogs] = useState<LogResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // selection state
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);

  // phase/round
  const [currentPhase, setCurrentPhase] = useState("Day");
  const [round, setRound] = useState(1);

  // backend action types (keep for compatibility)
  const [actionTypes, setActionTypes] = useState<any[]>([]);

  // elimination modal
  const [showElimination, setShowElimination] = useState(false);
  const [toEliminate, setToEliminate] = useState<string[]>([]);

  // NEW: action selection flow
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);
  const [requiredTargets, setRequiredTargets] = useState<number | null>(null);
  const [details, setDetails] = useState<any>({});

  // ---- Action metadata (single source of truth for UI rules) ----
  type ActionMeta = {
    id: string;
    name: string;
    tags: string[];
    phase: "day" | "night";
    separatePerTarget?: boolean;  // creates a log per target (for 1-tag actions)
    allowSelf?: boolean;          // can actor target themselves
    variableCount?: "k-of-n" | "n"; // prompt for counts
  };

  const ACTIONS: ActionMeta[] = [
    // Day actions
    { id: "fling_target", name: "Fling Target", tags: ["target"], phase: "day", separatePerTarget: true, allowSelf: false },
    { id: "target",       name: "Target",       tags: ["target"], phase: "day", separatePerTarget: true, allowSelf: false },
    { id: "siding",       name: "Siding",       tags: ["side"],   phase: "day", separatePerTarget: false, allowSelf: false },
    { id: "k_of_n_target",name: "K of N Target",tags: [],         phase: "day", separatePerTarget: false, variableCount: "k-of-n", allowSelf: false },
    { id: "cover",        name: "Cover",        tags: ["target"], phase: "day", separatePerTarget: true, allowSelf: false },
    { id: "k_of_n_cover", name: "K of N Cover", tags: [],         phase: "day", separatePerTarget: false, variableCount: "k-of-n", allowSelf: false },
    { id: "dialogue",     name: "Dialogue",     tags: ["target"], phase: "day", separatePerTarget: false, allowSelf: false },
    { id: "first_vote",   name: "First Vote",   tags: [],         phase: "day", separatePerTarget: false, variableCount: "n", allowSelf: false },
    { id: "second_vote",  name: "Second Vote",  tags: [],         phase: "day", separatePerTarget: false, variableCount: "n", allowSelf: false },
    { id: "defense",      name: "Defense",      tags: ["defense"],phase: "day", separatePerTarget: false, allowSelf: false },
    { id: "claim",        name: "Claim",        tags: [],         phase: "day", separatePerTarget: false, allowSelf: true  }, // choose role, no targets
    { id: "will",         name: "Will",         tags: [],         phase: "day", separatePerTarget: false, allowSelf: true  }, // composite note
    { id: "terror",       name: "Terror",       tags: ["target","guard","save"], phase: "day", separatePerTarget: false, allowSelf: false },

    // Night actions
    { id: "no_faces_choice", name: "No Faces Choice", tags: ["target"], phase: "night", separatePerTarget: false, allowSelf: false },
    { id: "boozers_shot",    name: "Boozer's Shot",   tags: ["target"], phase: "night", separatePerTarget: false, allowSelf: false },
    { id: "mafia_kill",      name: "Mafia Kill",      tags: ["target"], phase: "night", separatePerTarget: false, allowSelf: false },
    { id: "punished",        name: "Punished",        tags: ["target"], phase: "night", separatePerTarget: false, allowSelf: false },
    { id: "secured",         name: "Secured",         tags: ["target"], phase: "night", separatePerTarget: false, allowSelf: false },
    { id: "killer_target",   name: "Killer Target",   tags: ["mafia_suggest","city_saviour","city_suggest","killer_kill"], phase: "night", separatePerTarget: false, allowSelf: false },
    { id: "snipers_shot",    name: "Sniper's Shot",   tags: ["target"], phase: "night", separatePerTarget: false, allowSelf: false },
    { id: "doctors_save",    name: "Doctor's Save",   tags: ["save1","save2"], phase: "night", separatePerTarget: false, allowSelf: true },
  ];

  const findAction = (id?: string | null) => ACTIONS.find(a => a.id === id);

  // === Fetch players & logs (and phase) ===
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!gameId) return;

        const [gameRes, logsRes] = await Promise.all([
          getGameDetails(gameId),
          getLogsByGame(gameId),
        ]);

        setPlayers(gameRes.data.players);
        setLogs(logsRes.data);

        if (gameRes.data.current_phase) {
          setCurrentPhase(gameRes.data.current_phase === "day" ? "Day" : "Night");
        }
        if (gameRes.data.round_number) {
          setRound(gameRes.data.round_number);
        }

        // optional: load backend action types if you use them
        try {
          const at = await getActionTypes();
          setActionTypes(Array.isArray(at.data) ? at.data : at.data?.results || []);
        } catch {
          // ignore if endpoint absent
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [gameId]);

  // Clicking a card: choose actor first; once an action is selected, further clicks select targets.
  const handlePlayerClick = (playerId: string) => {
    // if no actor yet → set actor, reset
    if (!selectedPlayer) {
      setSelectedPlayer(playerId);
      setSelectedTargets([]);
      setSelectedActionId(null);
      setRequiredTargets(null);
      setDetails({});
      return;
    }

    // if actor chosen but no action yet → switch actor
    if (!selectedActionId) {
      setSelectedPlayer(playerId);
      setSelectedTargets([]);
      setDetails({});
      return;
    }

    // actor + action chosen → treat as target selection
    handleTargetSelect(playerId);
  };

  const handleTargetSelect = (targetId: string) => {
    if (!selectedPlayer || !selectedActionId) return;

    const action = findAction(selectedActionId)!;

    // prevent self-target if not allowed
    if (!action.allowSelf && targetId === selectedPlayer) {
      toast({ title: "Not allowed", description: "This action cannot target the actor themselves.", variant: "destructive" });
      return;
    }

    setSelectedTargets(prev => {
      const already = prev.includes(targetId);
      let next = already ? prev.filter(id => id !== targetId) : [...prev, targetId];

      // cap to required targets if fixed and not per-target logging
      if (!action.separatePerTarget && requiredTargets != null && next.length > requiredTargets) {
        next = next.slice(-requiredTargets);
      }
      return next;
    });
  };

  // Compute required count + collect details for variable actions
  const computeRequiredTargets = (a: ActionMeta): number | null => {
    // k-of-n: ask for k and n; enforce choosing n targets
    if (a.variableCount === "k-of-n") {
      const kStr = prompt("Enter k (number)");
      const nStr = prompt("Enter n (number)");
      const k = Number(kStr); const n = Number(nStr);
      if (!Number.isFinite(k) || !Number.isFinite(n) || n <= 0) return null;
      setDetails((d: any) => ({ ...d, k, n }));
      return n;
    }
    // n-only: ask for n; enforce choosing n targets
    if (a.variableCount === "n") {
      const nStr = prompt("Enter n (number of voters/targets)");
      const n = Number(nStr);
      if (!Number.isFinite(n) || n <= 0) return null;
      setDetails((d: any) => ({ ...d, n }));
      return n;
    }
    // claim: choose a role string, no targets
    if (a.id === "claim") {
      const role = prompt("Type the claimed role name");
      if (!role) return 0;
      setDetails((d: any) => ({ ...d, chosen_role: role }));
      return 0;
    }
    // will: optional note, no targets
    if (a.id === "will") {
      const note = prompt("Optional note for will (plays target, cover, and claim)");
      if (note) setDetails((d: any) => ({ ...d, note }));
      return 0;
    }
    // fixed: tags length
    return a.tags.length;
  };

  // Click an action → set selection rules, reset targets, maybe prompt for counts
  const onActionClick = (id: string) => {
    if (!selectedPlayer) {
      toast({ title: "Pick a player first", description: "Select the actor before choosing an action.", variant: "destructive" });
      return;
    }
    const action = findAction(id);
    if (!action) return;

    // phase check
    if (action.phase !== currentPhase.toLowerCase()) {
      toast({ title: "Phase mismatch", description: `“${action.name}” is for ${action.phase}.`, variant: "destructive" });
      return;
    }

    setSelectedActionId(id);
    setSelectedTargets([]);
    setDetails({});

    const count = computeRequiredTargets(action);
    if (count === null) {
      // user canceled prompt → reset
      setSelectedActionId(null);
      return;
    }
    setRequiredTargets(count);
  };

  // Whether submit is allowed
  const canLog = (() => {
    if (!selectedPlayer || !selectedActionId) return false;
    const a = findAction(selectedActionId)!;
    if (a.separatePerTarget) {
      if (a.tags.length === 1) return selectedTargets.length > 0;
      // multi-tag separate is unusual; require exact
      return selectedTargets.length === a.tags.length;
    }
    if (requiredTargets === 0) return true; // claim/will
    if (requiredTargets != null) return selectedTargets.length === requiredTargets;
    return selectedTargets.length === a.tags.length;
  })();

  // Submit logs with current selection
  const logSelectedAction = async () => {
    if (!gameId || !selectedPlayer || !selectedActionId) return;
    const action = findAction(selectedActionId)!;

    try {
      // Optionally respect backend actionTypes config (if present)
      const backendType = actionTypes.find((x: any) => x.slug === selectedActionId);
      const extraDetails = { ...details };
      if (backendType?.config?.choose_role && !extraDetails.chosen_role) {
        const r = prompt("Type the claimed role name");
        if (!r) return;
        extraDetails.chosen_role = r;
      }

      if (action.separatePerTarget && action.tags.length === 1) {
        // Create one log per target
        for (const targetId of selectedTargets) {
          await createLog({
            game: gameId!,
            game_player: selectedPlayer!,
            action_type: action.id,
            targets: [{ target: targetId, tag: "target" }],
            phase: currentPhase.toLowerCase() as "day" | "night",
            round_number: round,
            details: extraDetails,
          });
        }
      } else {
        const targets = action.tags.length
          ? selectedTargets.map((id, idx) => ({ target: id, tag: action.tags[idx] }))
          : [];
        await createLog({
          game: gameId!,
          game_player: selectedPlayer!,
          action_type: action.id,
          targets,
          phase: currentPhase.toLowerCase() as "day" | "night",
          round_number: round,
          details: extraDetails,
        });
      }

      toast({
        title: "Action Logged",
        description: `${action.name} recorded for ${players.find((p) => p.id === selectedPlayer)?.name}`,
      });

      // refresh logs (and players if needed)
      const [logsRes, gameRes] = await Promise.all([getLogsByGame(gameId!), getGameDetails(gameId!)]);
      setLogs(logsRes.data);
      setPlayers(gameRes.data.players);

      // reset selection
      setSelectedPlayer(null);
      setSelectedActionId(null);
      setSelectedTargets([]);
      setRequiredTargets(null);
      setDetails({});
    } catch (err: unknown) {
      const description = err instanceof Error ? err.message : "An unknown error occurred";
      toast({ title: "Error", description, variant: "destructive" });
    }
  };

  // Next phase opens elimination modal first
  const nextPhase = async () => {
    setShowElimination(true);
  };

  const handleEndGame = async () => {
    const winner = prompt("Enter winner side (e.g., Mafia, Citizens):");
    if (!winner) return;

    try {
      await completeGame(gameId!, winner);
      toast({ title: "Game Completed", description: `Winner: ${winner}` });
    } catch (err: unknown) {
      const description = err instanceof Error ? err.message : "An unknown error occurred";
      toast({ title: "Error", description, variant: "destructive" });
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

  const confirmEliminationsAndAdvance = async () => {
    if (!gameId) return;
    try {
      if (toEliminate.length > 0) {
        await terminatePlayers(gameId, toEliminate);
      }
      const phaseRes = (await advancePhase(gameId)) as { data: { current_phase: string; round_number: number } };

      const [gameRes, logsRes] = await Promise.all([getGameDetails(gameId), getLogsByGame(gameId)]);
      setPlayers(gameRes.data.players);
      setLogs(logsRes.data);

      setCurrentPhase(phaseRes.data.current_phase === "day" ? "Day" : "Night");
      setRound(phaseRes.data.round_number);
      setSelectedTargets([]);
      setShowElimination(false);
      setToEliminate([]);
      toast({ title: "Phase Changed", description: `Now entering ${phaseRes.data.current_phase} phase` });
    } catch (e: any) {
      const msg = e?.response?.data ? JSON.stringify(e.response.data) : e?.message || String(e);
      toast({ title: "Error", description: `Failed to confirm eliminations / advance phase: ${msg}`, variant: "destructive" });
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
          <Link to="/games" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Games
          </Link>

          <Button variant="destructive" onClick={handleEndGame}>
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
                <Button onClick={nextPhase} className="flex items-center gap-2">
                  Next Phase <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Players Grid */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Players</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {players
                    .filter((p: any) => !p.is_eliminated)
                    .map((player) => (
                      <Card
                        key={player.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedPlayer === player.id ? "ring-2 ring-primary shadow-lg" : ""
                        } ${
                          selectedTargets.includes(player.id) ? "ring-2 ring-accent" : ""
                        }`}
                        onClick={() => handlePlayerClick(player.id)}
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
                        {players.find((p) => p.id === selectedPlayer)?.name}
                      </p>
                    </div>

                    {selectedActionId && (
                      <div className="p-3 bg-accent/20 rounded-lg">
                        <p className="text-sm font-medium">Action:</p>
                        <p className="text-sm">
                          {findAction(selectedActionId)?.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {(() => {
                            const a = findAction(selectedActionId)!;
                            if (requiredTargets === 0) return `${a.name} requires no targets.`;
                            if (a.separatePerTarget && a.tags.length === 1) {
                              return `${a.name}: select one or more targets.`;
                            }
                            const need = requiredTargets ?? a.tags.length;
                            return `${a.name}: select ${need} target${need > 1 ? "s" : ""}. (${selectedTargets.length}/${need})`;
                          })()}
                        </p>
                      </div>
                    )}

                    {selectedTargets.length > 0 && (
                      <div className="p-3 bg-accent/20 rounded-lg">
                        <p className="text-sm font-medium">Target(s):</p>
                        <p>
                          {selectedTargets
                            .map((id) => players.find((p) => p.id === id)?.name)
                            .join(", ")}
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <h4 className="font-medium">Available Actions:</h4>
                      {ACTIONS
                        .filter((a) => a.phase === currentPhase.toLowerCase())
                        .map((action) => (
                          <Button
                            key={action.id}
                            variant={selectedActionId === action.id ? "default" : "outline"}
                            className="w-full justify-start"
                            onClick={() => onActionClick(action.id)}
                          >
                            {action.name}
                          </Button>
                        ))}
                    </div>

                    <Button className="w-full" onClick={logSelectedAction} disabled={!canLog}>
                      Log Action
                    </Button>
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
              {players
                .filter((p: any) => !p.is_eliminated)
                .map((p) => (
                  <label key={p.id} className="flex items-center gap-2 py-1">
                    <Checkbox
                      checked={toEliminate.includes(String(p.id))}
                      onCheckedChange={(checked) => {
                        const id = String(p.id);
                        setToEliminate((prev) =>
                          checked === true
                            ? Array.from(new Set([...prev, id]))
                            : prev.filter((x) => x !== id)
                        );
                      }}
                    />
                    <span>{p.name}</span>
                  </label>
                ))}
            </div>
            <AlertDialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setShowElimination(false)}>Cancel</Button>
              <Button onClick={confirmEliminationsAndAdvance}>Confirm & Next Phase</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </div>
  );
};

export default GameSession;
