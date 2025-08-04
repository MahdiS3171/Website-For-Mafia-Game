import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { addPlayer } from "../lib/api";

const AddPlayer = () => {
  const [name, setName] = useState("");
  const [gameId, setGameId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await addPlayer({ name, game: gameId });
      navigate(`/game/${gameId}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-xl mx-auto">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add Player to Game</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="text"
                placeholder="Player name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                type="text"
                placeholder="Game ID"
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
                required
              />

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Adding..." : "Add Player"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddPlayer;
