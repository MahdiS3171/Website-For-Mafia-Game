import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicOnlyRoute from "./components/PublicOnlyRoute";

import Index from "./pages/Index";
import AddPlayer from "./pages/AddPlayer";
import CreateGame from "./pages/CreateGame";
import AllGames from "./pages/AllGames";
import Results from "./pages/Results";
import GameSession from "./pages/GameSession";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes (non-authenticated) */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/results/:gameId"
            element={
              <PublicOnlyRoute>
                <Results />
              </PublicOnlyRoute>
            }
          />

          {/* Protected routes (authenticated) */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            }
          />
          <Route
            path="/games"
            element={
              <ProtectedRoute>
                <AllGames />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-game"
            element={
              <ProtectedRoute requireAdmin>
                <CreateGame />
              </ProtectedRoute>
            }
          />
          <Route
            path="/add-player"
            element={
              <ProtectedRoute requireAdmin>
                <AddPlayer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/game/:gameId"
            element={
              <ProtectedRoute>
                <GameSession />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
