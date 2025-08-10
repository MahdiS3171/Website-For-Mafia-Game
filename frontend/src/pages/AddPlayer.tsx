import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPlayer } from "../lib/api";
import { useToast } from "@/hooks/use-toast";

const AddPlayer = () => {
  const [name, setName] = useState("");
  const [nickname, setNickName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Create player
      const newPlayerRes = await createPlayer({ name, nickname });
      toast({
        title: "Player created",
        description: `Added ${newPlayerRes.data.name}${newPlayerRes.data.nickname ? ` (${newPlayerRes.data.nickname})` : ""}`,
      });
      setName("");
      setNickName("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-xl mx-auto">
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
                type="string"
                placeholder="nickname"
                value={nickname ?? ""}
                onChange={(e) => setNickName(e.target.value)}
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
