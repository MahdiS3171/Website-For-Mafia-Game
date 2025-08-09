import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Users, Trophy, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useGames, useGamePlayers } from "../hooks/useApi";
import { Game } from "../types/api";

const AllGames = () => {
  const { data: gamesResponse, isLoading, error } = useGames();
  const games = gamesResponse?.results || [];

  const getStatusColor = (game: Game) => {
    if (!game.is_active) {
      return "bg-red-100 text-red-800 border-red-200";
    }
    // You can add more logic here based on game state
    return "bg-blue-100 text-blue-800 border-blue-200";
  };

  const getStatusText = (game: Game) => {
    if (!game.is_active) {
      return "completed";
    }
    return "in-progress";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-2">Loading games...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <p className="text-red-600">Error loading games: {error.message}</p>
          </div>
        </div>
      </div>
    );
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
                      <CardTitle className="text-lg">{game.title || `Game #${game.id}`}</CardTitle>
                      <Badge className={getStatusColor(game)}>
                        {getStatusText(game).replace("-", " ")}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-2" />
                      {formatDate(game.created_at)}
                    </div>
                    
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="w-4 h-4 mr-2" />
                      Game ID: {game.id}
                    </div>

                    <div className="text-sm text-muted-foreground">
                      Active: {game.is_active ? "Yes" : "No"}
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