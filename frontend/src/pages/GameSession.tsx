import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Users, Clock, ArrowRight } from "lucide-react";
import { getGameDetails } from "../lib/api";
import { GameResponse, NestedPlayer } from "../types";

interface GameAction {
  name: string;
  requiresTargets: number;
  description: string;
}

const GameSession = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { toast } = useToast();

  const [game, setGame] = useState<GameResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [currentPhase, setCurrentPhase] = useState("Day");
  const [round, setRound] = useState(1);

  const availableActions: GameAction[] = [
    { name: "Vote", requiresTargets: 1, description: "Vote to eliminate a player" },
    { name: "Accuse", requiresTargets: 1, description: "Accuse someone of being mafia" },
    { name: "Defend", requiresTargets: 1, description: "Defend another player" },
    { name: "Investigate", requiresTargets: 1, description: "Investigate a player's role" },
    { name: "Heal", requiresTargets: 1, description: "Protect a player from elimination" },
    { name: "Kill", requiresTargets: 1, description: "Mafia action to eliminate" },
  ];

  // === Fetch game details on mount ===
  useEffect(() => {
    const fetchGame = async () => {
      if (!gameId) return;
      try {
        const res = await getGameDetails(gameId);
        setGame(res.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchGame();
  }, [gameId]);

  // === Handle Player Selection ===
  const handlePlayerClick = (playerId: string) => {
    setSelectedPlayer(playerId);
    setSelectedTargets([]); // reset targets
  };

  const handleTargetSelect = (targetId: string) => {
    if (targetId === selectedPlayer) return;

    setSelectedTargets((prev) =>
      prev.includes(targetId) ? prev.filter((id) => id !== targetId) : [...prev, targetId]
    );
  };

  const executeAction = (action: GameAction) => {
    if (selectedTargets.length !== action.requiresTargets) {
      toast({
        title: "Error",
        description: `Please select ${action.requiresTargets} target(s) for this action`,
        variant: "destructive",
      });
      return;
    }

    const actingPlayer = game?.players.find((p) => p.id === selectedPlayer)?.name;
    const targetPlayers = selectedTargets
      .map((id) => game?.players.find((p) => p.id === id)?.name)
      .join(", ");

    toast({
      title: "Action Executed",
      description: `${actingPlayer} used "${action.name}" on ${targetPlayers}`,
    });

    // Reset selections
    setSelectedPlayer(null);
    setSelectedTargets([]);
  };

  const nextPhase = () => {
    if (currentPhase === "Day") {
      setCurrentPhase("Night");
    } else {
      setCurrentPhase("Day");
      setRound((prev) => prev + 1);
    }

    setSelectedPlayer(null);
    setSelectedTargets([]);

    toast({
      title: "Phase Changed",
      description: `Now entering ${currentPhase === "Day" ? "Night" : "Day"} phase`,
    });
  };

  const getRoleColor = (role?: string) => {
    switch (role?.toLowerCase()) {
      case "mafia":
        return "bg-red-100 text-red-800 border-red-200";
      case "detective":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "doctor":
        return "bg-green-100 text-green-800 border-green-200";
      case "citizen":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-purple-100 text-purple-800 border-purple-200";
    }
  };

  // === Loading/Error States ===
  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading game...</div>;
  }

  if (error || !game) {
    return (
      <div className="text-center py-12 text-red-500">
        Failed to load game: {error || "Game not found"}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link
            to="/games"
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Games
          </Link>
        </div>

        {/* Game Status */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">Game #{game.id}</CardTitle>
                <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    Round {round}
                  </span>
                  <span className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {game.players.filter((p) => p).length} players
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
                  {game.players.map((player: NestedPlayer) => (
                    <Card
                      key={player.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedPlayer === player.id
                          ? "ring-2 ring-primary shadow-lg"
                          : ""
                      } ${
                        selectedTargets.includes(player.id)
                          ? "ring-2 ring-accent"
                          : ""
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
                            <span className="font-bold text-lg">
                              {player.seat_number}
                            </span>
                          </div>
                          <h3 className="font-semibold text-sm">{player.name}</h3>
                        </div>
                        <Badge className={getRoleColor(player.role)}>
                          {player.role || "Unassigned"}
                        </Badge>
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
                        {game.players.find((p) => p.id === selectedPlayer)?.name}
                      </p>
                    </div>

                    {selectedTargets.length > 0 && (
                      <div className="p-3 bg-accent/20 rounded-lg">
                        <p className="text-sm font-medium">Target(s):</p>
                        <p>
                          {selectedTargets
                            .map((id) => game.players.find((p) => p.id === id)?.name)
                            .join(", ")}
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <h4 className="font-medium">Available Actions:</h4>
                      {availableActions.map((action) => (
                        <Button
                          key={action.name}
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => executeAction(action)}
                          disabled={selectedTargets.length !== action.requiresTargets}
                        >
                          <div className="text-left">
                            <div className="font-medium">{action.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {action.description}
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>

                    {selectedTargets.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Click on other players to select targets for actions
                      </p>
                    )}
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
      </div>
    </div>
  );
};

export default GameSession;
