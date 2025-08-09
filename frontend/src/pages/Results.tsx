import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Trophy, Calendar, Users } from "lucide-react";

import { getGames, getGameDetails, getLogsByGame } from "../lib/api";
import { GameResponse, LogResponse } from "../types";

const Results = () => {
  const { gameId } = useParams<{ gameId: string }>();

  const [games, setGames] = useState<GameResponse[]>([]);
  const [logs, setLogs] = useState<LogResponse[]>([]);
  const [game, setGame] = useState<GameResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (gameId) {
          // Fetch details for a single game
          const gameRes = await getGameDetails(gameId);
          const gameData = gameRes.data;

          // Show only completed games
          if (!gameData || gameData.is_active) {
            setError("Game not found or not completed yet");
            return;
          }

          setGame(gameData);

          // Fetch logs for this game
          const logsRes = await getLogsByGame(gameId);
          setLogs(logsRes.data);
        } else {
          // Fetch all games (completed only)
          const gamesRes = await getGames();
          const completed = gamesRes.data.filter((g) => !g.is_active);

          setGames(completed);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message || "Failed to load results");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [gameId]);

  // =====================
  // Loading / Error States
  // =====================
  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading results...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg">{error}</p>
      </div>
    );
  }

  // =====================
  // Game List View
  // =====================
  if (!gameId) {
    if (games.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No completed games found</p>
          <p>Complete some games to see results here!</p>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Completed Games</h1>
            <p className="text-muted-foreground">Select a game to view detailed results</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {games.map((g) => (
              <Card key={g.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">Game #{g.id}</CardTitle>
                    <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>
                  </div>
                  <CardDescription className="flex items-center gap-4 mt-1">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(g.date).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center text-sm text-muted-foreground mb-3">
                    <Users className="w-4 h-4 mr-1" /> {g.players?.length || 0} players
                  </div>
                  <Button asChild size="sm" className="w-full">
                    <Link to={`/results/${g.id}`}>View Results</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // =====================
  // Single Game Results View
  // =====================

  // Build player columns
  const players = game?.players || [];
  const actions = logs || [];

  // Unique action rows (group by timestamp or action type)
  const uniqueActions = actions.map((log) => ({
    timestamp: new Date(log.created_at).toLocaleTimeString(),
    actor: players.find((p) => p.id === log.game_player.toString())?.name || "Unknown",
    type: typeof log.action_type === "string" ? log.action_type : log.action_type.name,
    targets: log.targets
      .map((t) => {
        const playerName =
          players.find((p) => p.id === t.target.toString())?.name || t.player_name || "Unknown";
        return t.tag ? `${playerName} (${t.tag})` : playerName;
      })
      .join(", "),
    phase: log.phase,
    round: log.round_number,
  }));

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link to="/results" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Results
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Game #{game?.id} Results</h1>
          <p className="text-muted-foreground">Detailed actions and phases for this game</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Action Log</CardTitle>
            <CardDescription>Chronological record of all actions</CardDescription>
          </CardHeader>
          <CardContent>
            {uniqueActions.length === 0 ? (
              <div className="text-center text-muted-foreground py-6">No actions recorded for this game.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Phase</TableHead>
                      <TableHead>Round</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Targets</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uniqueActions.map((a, index) => (
                      <TableRow key={index}>
                        <TableCell>{a.timestamp}</TableCell>
                        <TableCell className="capitalize">{a.phase}</TableCell>
                        <TableCell>{a.round}</TableCell>
                        <TableCell>{a.actor}</TableCell>
                        <TableCell>
                          {typeof a.type === "string" ? a.type : a.type.name}
                        </TableCell>
                        <TableCell>{a.targets}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Results;
