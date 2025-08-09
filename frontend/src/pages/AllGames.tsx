import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { getGames } from "../lib/api";
import { GameResponse } from "../types";

const AllGames = () => {
  const [games, setGames] = useState<GameResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const res = await getGames();
        setGames(res.data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? "bg-blue-100 text-blue-800 border-blue-200"
      : "bg-green-100 text-green-800 border-green-200";
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
          <Link
            to="/"
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">All Games</CardTitle>
            <CardDescription>View all games (active and completed)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {games.map((game) => (
                <Card key={game.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">Game #{game.id}</CardTitle>
                      <Badge className={getStatusColor(game.is_active)}>
                        {game.is_active ? "In Progress" : "Completed"}
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
                      {game.players.length} players
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        asChild
                        size="sm"
                        className="flex-1"
                        variant={game.is_active ? "default" : "outline"}
                      >
                        <Link to={`/game/${game.id}`}>
                          {game.is_active ? "Continue" : "View"}
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {games.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg">No games found</p>
                <p>Create a new game to get started!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AllGames;
