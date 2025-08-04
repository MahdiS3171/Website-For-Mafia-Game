import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

interface GamePlayer {
  id: string;
  playerId: string;
  playerName: string;
  seatNumber: number;
  role: string;
}

const CreateGame = () => {
  const [gamePlayers, setGamePlayers] = useState<GamePlayer[]>([]);
  const { toast } = useToast();

  // Mock data - replace with actual database calls
  const availablePlayers = [
    { id: "1", name: "John Doe" },
    { id: "2", name: "Jane Smith" },
    { id: "3", name: "Mike Johnson" },
    { id: "4", name: "Sarah Wilson" },
  ];

  const availableRoles = [
    "Mafia",
    "Citizen",
    "Doctor",
    "Detective",
    "Godfather",
    "Sheriff",
  ];

  const addPlayer = () => {
    const newPlayer: GamePlayer = {
      id: Date.now().toString(),
      playerId: "",
      playerName: "",
      seatNumber: gamePlayers.length + 1,
      role: "",
    };
    setGamePlayers([...gamePlayers, newPlayer]);
  };

  const removePlayer = (id: string) => {
    setGamePlayers(gamePlayers.filter(p => p.id !== id));
  };

  const updatePlayer = (id: string, field: keyof GamePlayer, value: string | number) => {
    setGamePlayers(gamePlayers.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const handlePlayerSelect = (id: string, playerId: string) => {
    const selectedPlayer = availablePlayers.find(p => p.id === playerId);
    if (selectedPlayer) {
      updatePlayer(id, "playerId", playerId);
      updatePlayer(id, "playerName", selectedPlayer.name);
    }
  };

  const createGame = () => {
    if (gamePlayers.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one player",
        variant: "destructive",
      });
      return;
    }

    const incompletePlayer = gamePlayers.find(p => !p.playerId || !p.role);
    if (incompletePlayer) {
      toast({
        title: "Error",
        description: "Please fill in all player details",
        variant: "destructive",
      });
      return;
    }

    // TODO: Create game in database
    toast({
      title: "Success",
      description: "Game created successfully!",
    });
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Create New Game</CardTitle>
            <CardDescription>
              Select players and assign their roles and seats
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Game Players</h3>
              <Button onClick={addPlayer} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Player
              </Button>
            </div>

            <div className="space-y-4">
              {gamePlayers.map((player) => (
                <Card key={player.id} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2">
                      <Label>Player</Label>
                      <Select onValueChange={(value) => handlePlayerSelect(player.id, value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select player" />
                        </SelectTrigger>
                        <SelectContent>
                          {availablePlayers.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Seat Number</Label>
                      <Input
                        type="number"
                        value={player.seatNumber}
                        onChange={(e) => updatePlayer(player.id, "seatNumber", parseInt(e.target.value))}
                        min="1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select onValueChange={(value) => updatePlayer(player.id, "role", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableRoles.map((role) => (
                            <SelectItem key={role} value={role}>
                              {role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removePlayer(player.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {gamePlayers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No players added yet. Click "Add Player" to get started.
              </div>
            )}

            <Button onClick={createGame} className="w-full" size="lg">
              Create Game
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateGame;