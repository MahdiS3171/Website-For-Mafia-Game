import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Users, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../config";

interface Game {
  id: string;
  date: string;
  playerCount: number;
  status: "completed" | "in-progress" | "abandoned";
  winner?: string;
  duration?: string;
}

const AllGames = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/games/`);
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data = await res.json();
        setGames(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  const getStatusColor = (status: Game["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "abandoned":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading games...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">Failed to load games: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">All Games</CardTitle>
            <CardDescription>
              View all games that have been created
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {games.map((game) => (
                <Card key={game.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">Game #{game.id}</CardTitle>
                      <Badge className={getStatusColor(game.status)}>
                        {game.status.replace("-", " ")}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(game.date).toLocaleDateString()}
                    </div>

                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="w-4 h-4 mr-2" />
                      {game.playerCount} players
                    </div>

                    {game.winner && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Trophy className="w-4 h-4 mr-2" />
                        Winner: {game.winner}
                      </div>
                    )}

                    {game.duration && (
                      <div className="text-sm text-muted-foreground">
                        Duration: {game.duration}
                      </div>
                    )}

                    <div className="flex gap-2 mt-4">
                      <Button
                        asChild
                        size="sm"
                        className="flex-1"
                        variant={game.status === "in-progress" ? "default" : "outline"}
                      >
                        <Link to={`/game/${game.id}`}>
                          {game.status === "in-progress" ? "Continue" : "View"}
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {games.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No games found</p>
                <p>Create your first game to get started!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AllGames;
