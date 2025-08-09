import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCreatePlayer } from "../hooks/useApi";

const AddPlayer = () => {
  const [playerName, setPlayerName] = useState("");
  const [nickname, setNickname] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const createPlayerMutation = useCreatePlayer();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a player name",
        variant: "destructive",
      });
      return;
    }

    try {
      await createPlayerMutation.mutateAsync({
        name: playerName.trim(),
        nickname: nickname.trim() || undefined,
      });

      toast({
        title: "Success",
        description: `Player "${playerName}" has been added`,
      });
      
      setPlayerName("");
      setNickname("");
      
      // Optionally navigate back to home
      navigate("/");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add player",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Add New Player</CardTitle>
            <CardDescription>
              Add a new player to the database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="playerName">Full Name *</Label>
                <Input
                  id="playerName"
                  type="text"
                  placeholder="Enter player's full name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nickname">Nickname (Optional)</Label>
                <Input
                  id="nickname"
                  type="text"
                  placeholder="Enter player's nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={createPlayerMutation.isPending}
              >
                {createPlayerMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding Player...
                  </>
                ) : (
                  "Add Player"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddPlayer;