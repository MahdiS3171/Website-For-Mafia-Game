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

  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [currentPhase, setCurrentPhase] = useState("Day");
  const [round, setRound] = useState(1);
  const [actionTypes, setActionTypes] = useState<any[]>([]);
  const [showElimination, setShowElimination] = useState(false);
  const [toEliminate, setToEliminate] = useState<string[]>([]);

  // === Fetch players & logs ===
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
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [gameId]);

  const handlePlayerClick = (playerId: string) => {
    if (!players.find((p) => p.id === playerId)) return;
    setSelectedPlayer(playerId);
    setSelectedTargets([]);
  };

  const handleTargetSelect = (targetId: string) => {
    if (targetId === selectedPlayer) return;

    if (selectedTargets.includes(targetId)) {
      setSelectedTargets(selectedTargets.filter((id) => id !== targetId));
    } else {
      setSelectedTargets([...selectedTargets, targetId]);
    }
  };

  const actionConfigs = [
    { id: "target", name: "Target", tags: ["target"], separatePerTarget: true, phase: "day" },
    { id: "cover", name: "Cover", tags: ["target"], separatePerTarget: true, phase: "day" },
    { id: "siding", name: "Siding", tags: ["side"], phase: "day" },
    { id: "dialogue", name: "Dialogue", tags: ["target"], phase: "day" },
    { id: "terror", name: "Terror", tags: ["target", "guard", "save"], phase: "night" },
    { id: "killer_target", name: "Killer Target", tags: ["mafia_suggest", "city_saviour", "city_suggest", "killer_kill"], phase: "night" },
    { id: "doctors_save", name: "Doctor's Save", tags: ["save1", "save2"], phase: "night" },
  ];

  const executeAction = async (actionId: string) => {
    if (!selectedPlayer) {
      toast({ title: "Error", description: "Select a player first", variant: "destructive" });
      return;
    }

    const action = actionConfigs.find((a) => a.id === actionId);
    if (!action) return;

    const details: any = {};
    const backendType = actionTypes.find((x:any) => x.slug === actionId);
    if (backendType?.config?.choose_role) {
      const r = prompt('Type the claimed role name');
      if (!r) return; details.chosen_role = r;
    }
    if (backendType?.config?.params?.includes('k')) {
      const kStr = prompt('Enter k (number)');
      if (!kStr) return; details.k = Number(kStr);
    }
    if (backendType?.config?.params?.includes('n')) {
      const nStr = prompt('Enter n (number)');
      if (!nStr) return; details.n = Number(nStr);
    }

    try {
      if (action.separatePerTarget) {
        for (const targetId of selectedTargets) {
          await createLog({
            game: gameId!,
            game_player: selectedPlayer,
            action_type: action.id,
            targets: [{ target: targetId, tag: action.tags[0] }],
            phase: currentPhase.toLowerCase() as "day" | "night",
            round_number: round,
          , details });
        }
      } else {
        if (action.tags.length && selectedTargets.length !== action.tags.length) {
          toast({
            title: "Invalid targets",
            description: `This action requires ${action.tags.length} targets`,
            variant: "destructive",
          , details });
          return;
        }
        const targets = selectedTargets.map((id, idx) => ({ target: id, tag: action.tags[idx] }));
        await createLog({
          game: gameId!,
          game_player: selectedPlayer,
          action_type: action.id,
          targets,
          phase: currentPhase.toLowerCase() as "day" | "night",
          round_number: round,
        , details });
      }

      toast({
        title: "Action Logged",
        description: `${action.name} recorded for ${players.find((p) => p.id === selectedPlayer)?.name}`,
      });
      const logsRes = await getLogsByGame(gameId!);
      setLogs(logsRes.data);
    } catch (err: unknown) {
      const description = err instanceof Error ? err.message : "An unknown error occurred";
      toast({ title: "Error", description, variant: "destructive" });
    } finally {
      setSelectedPlayer(null);
      setSelectedTargets([]);
    }
  };

  const nextPhase = async () => {
    // open elimination modal first
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
    if (toEliminate.length) {
      await terminatePlayers(gameId, toEliminate);
    }
    const res = await advancePhase(gameId);
    const updated = res.data;
    setCurrentPhase((updated.current_phase || 'day').replace(/^./, c => c.toUpperCase()));
    setRound(updated.round_number || round);
    setSelectedTargets([]);
    setShowElimination(false);
    setToEliminate([]);
    toast({ title: "Phase Changed", description: `Now entering ${updated.current_phase} phase` });
    const logsRes = await getLogsByGame(gameId);
    setLogs(logsRes.data);
  } catch (e) {
    toast({ title: "Error", description: "Failed to advance phase", variant: "destructive" });
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

          {/* End Game Button */}
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
                  {players.map((player) => (
                    <Card
                      key={player.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedPlayer === player.id ? "ring-2 ring-primary shadow-lg" : ""
                      } ${
                        selectedTargets.includes(player.id) ? "ring-2 ring-accent" : ""
                      }`}
                      onClick={() =>
                        selectedPlayer
                          ? handleTargetSelect(player.id)
                          : handlePlayerClick(player.id)
                      }
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
                      {actionConfigs
                        .filter((a) => a.phase.toLowerCase() === currentPhase.toLowerCase())
                        .map((action) => (
                          <Button
                            key={action.id}
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => executeAction(action.id)}
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


<AlertDialog open={showElimination} onOpenChange={setShowElimination}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Select eliminated players for this phase</AlertDialogTitle>
    </AlertDialogHeader>
    <div className="space-y-2 max-h-64 overflow-auto">
      {players.map((p) => (
        <label key={p.id} className="flex items-center gap-2 py-1">
          <Checkbox
            checked={toEliminate.includes(p.id)}
            onCheckedChange={(checked) => {
              setToEliminate((prev) => {
                const id = p.id as string;
                if (checked) return Array.from(new Set([...prev, id]));
                return prev.filter((x) => x !== id);
              });
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
