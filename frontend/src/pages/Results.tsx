import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, Target, Users, Calendar, Lock } from "lucide-react";
import { Link, useParams } from "react-router-dom";

interface PlayerResult {
  playerName: string;
  role: string;
  seatNumber: number;
  survived: boolean;
  eliminatedRound?: number;
  votesReceived: number;
  votesGiven: number;
  score: number;
}

interface GameResult {
  gameId: string;
  date: string;
  winner: string;
  totalRounds: number;
  players: PlayerResult[];
}

const Results = () => {
  const { gameId } = useParams();
  const isAdmin = localStorage.getItem("isAdmin") === "true";
  
  // Mock data - replace with actual database calls
  const gameResults: GameResult[] = [
    {
      gameId: "1",
      date: "2024-01-15",
      winner: "Mafia",
      totalRounds: 6,
      players: [
        {
          playerName: "John Doe",
          role: "Mafia",
          seatNumber: 1,
          survived: true,
          votesReceived: 2,
          votesGiven: 4,
          score: 85,
        },
        {
          playerName: "Jane Smith",
          role: "Detective",
          seatNumber: 2,
          survived: false,
          eliminatedRound: 4,
          votesReceived: 5,
          votesGiven: 3,
          score: 65,
        },
        {
          playerName: "Mike Johnson",
          role: "Citizen",
          seatNumber: 3,
          survived: false,
          eliminatedRound: 2,
          votesReceived: 6,
          votesGiven: 1,
          score: 30,
        },
        {
          playerName: "Sarah Wilson",
          role: "Doctor",
          seatNumber: 4,
          survived: true,
          votesReceived: 1,
          votesGiven: 5,
          score: 75,
        },
      ],
    },
    {
      gameId: "2",
      date: "2024-01-14",
      winner: "Citizens",
      totalRounds: 5,
      players: [
        {
          playerName: "Alice Brown",
          role: "Sheriff",
          seatNumber: 1,
          survived: true,
          votesReceived: 0,
          votesGiven: 4,
          score: 90,
        },
        {
          playerName: "Bob Wilson",
          role: "Mafia",
          seatNumber: 2,
          survived: false,
          eliminatedRound: 5,
          votesReceived: 4,
          votesGiven: 4,
          score: 70,
        },
        {
          playerName: "Charlie Davis",
          role: "Citizen",
          seatNumber: 3,
          survived: true,
          votesReceived: 1,
          votesGiven: 3,
          score: 60,
        },
      ],
    },
  ];

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "mafia":
      case "godfather":
        return "bg-red-100 text-red-800 border-red-200";
      case "detective":
      case "sheriff":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "doctor":
        return "bg-green-100 text-green-800 border-green-200";
      case "citizen":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-purple-100 text-purple-800 border-purple-200";
    }
  };

  // If gameId is provided, show individual game results
  if (gameId) {
    const gameResult = gameResults.find(game => game.gameId === gameId);
    
    if (!gameResult) {
      return (
        <div className="min-h-screen bg-background p-4">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <Link to="/results" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Results
              </Link>
            </div>
            <Card>
              <CardContent className="text-center py-12">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg text-muted-foreground">Game not found</p>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Link to="/results" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Results
            </Link>
          </div>

          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Game #{gameResult.gameId} Results</h1>
            <p className="text-muted-foreground">Detailed performance statistics for this game</p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-xl">Game #{gameResult.gameId}</CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-1">
                    <span>{new Date(gameResult.date).toLocaleDateString()}</span>
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {gameResult.players.length} players
                    </span>
                    <span className="flex items-center">
                      <Target className="w-4 h-4 mr-1" />
                      {gameResult.totalRounds} rounds
                    </span>
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    Winner: {gameResult.winner}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Seat</TableHead>
                      <TableHead>Player</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Votes Received</TableHead>
                      <TableHead>Votes Given</TableHead>
                      <TableHead>Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gameResult.players.map((player) => (
                      <TableRow key={player.playerName}>
                        <TableCell className="font-medium">{player.seatNumber}</TableCell>
                        <TableCell className="font-medium">{player.playerName}</TableCell>
                        <TableCell>
                          <Badge className={getRoleColor(player.role)}>
                            {player.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {player.survived ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              Survived
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 border-red-200">
                              Eliminated (Round {player.eliminatedRound})
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{player.votesReceived}</TableCell>
                        <TableCell>{player.votesGiven}</TableCell>
                        <TableCell>
                          <span className="font-semibold">{player.score}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show list of games to select from
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header with conditional navigation */}
        <div className="mb-6">
          {isAdmin ? (
            <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          ) : (
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Game Results</h1>
                <p className="text-muted-foreground">View completed game statistics and player performance</p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/login" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Admin Login
                </Link>
              </Button>
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              {isAdmin ? "Game Results" : "Available Games"}
            </CardTitle>
            <CardDescription>
              {isAdmin 
                ? "Select a game to view detailed results and player performance"
                : "Browse completed games and view player statistics"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gameResults.map((game) => (
                <Card key={game.gameId} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">Game #{game.gameId}</CardTitle>
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        Completed
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

                    <div className="flex items-center text-sm text-muted-foreground">
                      <Trophy className="w-4 h-4 mr-2" />
                      Winner: {game.winner}
                    </div>

                    <div className="text-sm text-muted-foreground">
                      Rounds: {game.totalRounds}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button 
                        asChild 
                        size="sm" 
                        className="flex-1"
                      >
                        <Link to={`/results/${game.gameId}`}>
                          View Results
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {gameResults.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No completed games found</p>
                <p>Complete some games to see results here!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Results;