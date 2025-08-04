import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Users, Trophy, Lock } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { getGames, getGameDetails, getActionsByGame } from "../lib/api";
import { GameResponse, NestedPlayer, Action } from "../types";

const Results = () => {
  const { gameId } = useParams();
  const isAdmin = localStorage.getItem("isAdmin") === "true";

  const [games, setGames] = useState<GameResponse[]>([]);
  const [game, setGame] = useState<GameResponse | null>(null);
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // === Fetch data ===
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (gameId) {
          const [gameRes, actionsRes] = await Promise.all([
            getGameDetails(gameId),
            getActionsByGame(gameId),
          ]);
          setGame(gameRes.data);
          setActions(actionsRes.data as Action[]);
        } else {
          const res = await getGames();
          setGames(res.data.filter((g) => !g.is_active));
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [gameId]);

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading results...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">Failed to load results: {error}</div>;
  }

  // === Single game results (table) ===
  if (gameId && game) {
    const players = game.players; // columns
    const playerMap = new Map(players.map((p) => [p.id, p]));

    // Group actions by timestamp (row = moment in game)
    const groupedActions = actions.reduce((acc: any[], action) => {
      const time = new Date(action.timestamp).toLocaleTimeString();
      let row = acc.find((r) => r.time === time);
      if (!row) {
        row = { time, entries: {} };
        acc.push(row);
      }
      row.entries[action.player] = action; // map player ID → action
      return acc;
    }, []);

    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Link
              to="/results"
              className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Results
            </Link>
          </div>

          <h1 className="text-3xl font-bold mb-4">Game #{game.id} Results</h1>
          <p className="text-muted-foreground mb-6">
            Actions performed by players during this game
          </p>

          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="p-2 border">Time</th>
                  {players.map((p) => (
                    <th key={p.id} className="p-2 border">
                      <div className="flex flex-col items-center">
                        <span className="font-semibold">{p.name}</span>
                        <Badge variant="outline" className="mt-1">
                          Seat {p.seat_number}
                        </Badge>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groupedActions.map((row) => (
                  <tr key={row.time}>
                    <td className="p-2 border text-sm text-muted-foreground">{row.time}</td>
                    {players.map((p) => {
                      const act = row.entries[p.id];
                      return (
                        <td key={p.id} className="p-2 border text-sm">
                          {act ? (
                            <>
                              <span className="font-medium">{act.type}</span>
                              {act.target && (
                                <span className="block text-xs text-muted-foreground">
                                  → {playerMap.get(act.target)?.name || "Unknown"}
                                </span>
                              )}
                            </>
                          ) : (
                            "-"
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // === Completed games list ===
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          {isAdmin ? (
            <Link
              to="/"
              className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          ) : (
            <div className="flex justify-between items-center w-full">
              <h1 className="text-3xl font-bold">Completed Games</h1>
              <Button asChild variant="outline" size="sm">
                <Link to="/login">
                  <Lock className="w-4 h-4 mr-2" />
                  Admin Login
                </Link>
              </Button>
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Completed Games</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {games.map((g) => (
                <Card key={g.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">Game #{g.id}</CardTitle>
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        Completed
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(g.date).toLocaleDateString()}
                    </div>

                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="w-4 h-4 mr-2" />
                      {g.players.length} players
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button asChild size="sm" className="flex-1">
                        <Link to={`/results/${g.id}`}>View Results</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Results;
