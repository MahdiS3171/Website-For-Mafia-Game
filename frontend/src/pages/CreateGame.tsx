import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { usePlayers, useRoles, useCreateGame, useCreateGamePlayer } from "../hooks/useApi";
import { Player, Role } from "../types/api";

interface GamePlayer {
  id: string;
  playerId: string;
  playerName: string;
  seatNumber: number;
  roleId: string;
  roleName: string;
}

const CreateGame = () => {
  const [gameTitle, setGameTitle] = useState("");
  const [gamePlayers, setGamePlayers] = useState<GamePlayer[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  // API hooks
  const { data: playersResponse, isLoading: playersLoading } = usePlayers();
  const { data: rolesResponse, isLoading: rolesLoading } = useRoles();
  const createGameMutation = useCreateGame();
  const createGamePlayerMutation = useCreateGamePlayer();

  const availablePlayers = playersResponse?.results || [];
  const availableRoles = rolesResponse?.results || [];

  const addPlayer = () => {
    const newPlayer: GamePlayer = {
      id: Date.now().toString(),
      playerId: "",
      playerName: "",
      seatNumber: gamePlayers.length + 1,
      roleId: "",
      roleName: "",
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
    const selectedPlayer = availablePlayers.find(p => p.id.toString() === playerId);
    if (selectedPlayer) {
      updatePlayer(id, "playerId", playerId);
      updatePlayer(id, "playerName", selectedPlayer.name);
    }
  };

  const handleRoleSelect = (id: string, roleId: string) => {
    const selectedRole = availableRoles.find(r => r.id.toString() === roleId);
    if (selectedRole) {
      updatePlayer(id, "roleId", roleId);
      updatePlayer(id, "roleName", selectedRole.name);
    }
  };

  const createGame = async () => {
    if (!gameTitle.trim()) {
      toast({
        title: "Error",
        description: "Please enter a game title",
        variant: "destructive",
      });
      return;
    }

    if (gamePlayers.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one player",
        variant: "destructive",
      });
      return;
    }

    const incompletePlayer = gamePlayers.find(p => !p.playerId || !p.roleId);
    if (incompletePlayer) {
      toast({
        title: "Error",
        description: "Please fill in all player details",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create the game
      const game = await createGameMutation.mutateAsync({
        title: gameTitle.trim(),
        is_active: true,
      });

      // Add players to the game
      for (const gamePlayer of gamePlayers) {
        await createGamePlayerMutation.mutateAsync({
          game: game.id,
          player: parseInt(gamePlayer.playerId),
          role: parseInt(gamePlayer.roleId),
          seat_number: gamePlayer.seatNumber,
        });
      }

      toast({
        title: "Success",
        description: "Game created successfully!",
      });

      // Navigate to the game detail page
      navigate(`/game/${game.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create game",
        variant: "destructive",
      });
    }
  };

  if (playersLoading || rolesLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-2">Loading data...</span>
          </div>
        </div>
      </div>
    );
  }

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
            <div className="space-y-2">
              <Label htmlFor="gameTitle">Game Title</Label>
              <Input
                id="gameTitle"
                type="text"
                placeholder="Enter game title"
                value={gameTitle}
                onChange={(e) => setGameTitle(e.target.value)}
                className="w-full"
              />
            </div>

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
                            <SelectItem key={p.id} value={p.id.toString()}>
                              {p.nickname || p.name}
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
                      <Select onValueChange={(value) => handleRoleSelect(player.id, value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableRoles.map((role) => (
                            <SelectItem key={role.id} value={role.id.toString()}>
                              {role.name}
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

            <Button 
              onClick={createGame} 
              className="w-full" 
              size="lg"
              disabled={createGameMutation.isPending}
            >
              {createGameMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Game...
                </>
              ) : (
                "Create Game"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateGame;