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
          {/* Public routes - only accessible to non-admin users */}
          <Route path="/results" element={
            <PublicOnlyRoute>
              <Results />
            </PublicOnlyRoute>
          } />
          <Route path="/results/:gameId" element={
            <PublicOnlyRoute>
              <Results />
            </PublicOnlyRoute>
          } />
          
          {/* Root route - redirect based on authentication */}
          <Route path="/" element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          } />
          
          {/* Admin-only routes */}
          <Route path="/add-player" element={
            <ProtectedRoute requireAdmin>
              <AddPlayer />
            </ProtectedRoute>
          } />
          <Route path="/create-game" element={
            <ProtectedRoute requireAdmin>
              <CreateGame />
            </ProtectedRoute>
          } />
          <Route path="/games" element={
            <ProtectedRoute requireAdmin>
              <AllGames />
            </ProtectedRoute>
          } />
          <Route path="/game/:gameId" element={
            <ProtectedRoute requireAdmin>
              <GameSession />
            </ProtectedRoute>
          } />
          
          {/* Login route */}
          <Route path="/login" element={<Login />} />
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
