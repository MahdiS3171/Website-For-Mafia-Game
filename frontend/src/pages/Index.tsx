import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import {
  UserPlus,
  Gamepad2,
  Trophy,
  BarChart3,
  Users,
  Target,
  LogOut,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = () => {
    // Clear stored auth (token or username)
    localStorage.removeItem("token");
    localStorage.removeItem("adminUsername");
    localStorage.removeItem("isAdmin");

    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });

    // Redirect to login or results page
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="text-center flex-1">
              <h1 className="text-4xl font-bold text-foreground mb-2">Game Logger</h1>
              <p className="text-xl text-muted-foreground">
                Track and analyze your game sessions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Welcome, {localStorage.getItem("adminUsername") || "Admin"}
              </span>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Add Player */}
          <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            <CardHeader className="text-center pb-3">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <UserPlus className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Add Player</CardTitle>
              <CardDescription>Register new players to the database</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full" size="lg">
                <Link to="/add-player">Add New Player</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Create Game */}
          <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            <CardHeader className="text-center pb-3">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <Gamepad2 className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Create Game</CardTitle>
              <CardDescription>
                Start a new game session with players and roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full" size="lg">
                <Link to="/create-game">Create New Game</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Show All Games */}
          <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            <CardHeader className="text-center pb-3">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-xl">All Games</CardTitle>
              <CardDescription>
                View all previous and ongoing game sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full" size="lg" variant="outline">
                <Link to="/games">View All Games</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            <CardHeader className="text-center pb-3">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <BarChart3 className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Results</CardTitle>
              <CardDescription>
                Analyze performance and game statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full" size="lg" variant="outline">
                <Link to="/results">View Results</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-secondary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Player Management</h3>
              <p className="text-muted-foreground">
                Easily add and manage players with their roles and seat assignments
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-secondary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Action Logging</h3>
              <p className="text-muted-foreground">
                Track every action and interaction during gameplay sessions
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-secondary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Performance Analysis</h3>
              <p className="text-muted-foreground">
                Detailed statistics and performance metrics for every player
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
