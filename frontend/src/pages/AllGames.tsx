import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Users, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { getGames } from "../lib/api";
import { GameResponse } from "../types";
import { Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { deleteGame as apiDeleteGame } from "@/lib/api";

const AllGames = () => {
  const [games, setGames] = useState<GameResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | number | null>(null);
  const { toast } = useToast();

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

  const confirmDeleteGame = async () => {
    if (!deleteId) return;
    try {
      await apiDeleteGame(deleteId);
      // Remove from UI immediately
      setGames(prev => prev.filter(g => String(g.id) !== String(deleteId)));
      toast({ title: "Game deleted" });
    } catch (e: any) {
      const msg = e?.response?.data ? JSON.stringify(e.response.data) : e?.message || "Failed to delete game";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setDeleteId(null);
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
                <Card key={game.id} className={`relative hover:shadow-md transition-shadow border-l-4 ${game.is_active ? "border-l-emerald-500" : "border-l-slate-400"}`}>
                  {/* Delete button pinned to this card */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-3 z-10 text-red-500 hover:text-red-600"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteId(game.id); }}
                    title="Delete game"
                    aria-label="Delete game"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>

                  <CardHeader className="pb-3 pr-10">
                    <CardTitle className="text-lg">
                      {game.title || `Game #${game.id}`}
                    </CardTitle>
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      <span className={`inline-block h-2.5 w-2.5 rounded-full ${game.is_active ? "bg-green-600" : "bg-blue-600"}`} />
                      <span className="text-muted-foreground">{game.is_active ? "In Progress" : "Completed"}</span>
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

                    {game.winner && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Trophy className="w-4 h-4 mr-2" />
                        Winner: {game.winner}
                      </div>
                    )}

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

        <AlertDialog open={deleteId != null} onOpenChange={(o) => !o && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this game?</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="text-sm text-muted-foreground">
              This will permanently remove the game and all of its logs, turns, and related records.
            </div>
            <AlertDialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={confirmDeleteGame}>Delete</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default AllGames;
