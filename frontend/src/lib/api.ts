// src/lib/api.ts
import axios from "axios";
import {
  GameResponse,
  GamePlayerResponse,
  PlayerResponse,
  Action,
} from "../types";

// =======================
// API Setup
// =======================
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
});

// =======================
// Games API
// =======================

/** Get all games (active + completed) */
export const getGames = () => api.get<GameResponse[]>("/games/");

/** Get single game details (includes nested players) */
export const getGameDetails = (id: string) =>
  api.get<GameResponse>(`/games/${id}/`);

/** Create a new game */
export const createGame = (data: { name?: string; date: string }) =>
  api.post<GameResponse>("/games/", data);

// =======================
// Game Players API
// =======================

/** Get players assigned to a specific game */
export const getGamePlayers = (gameId: string) =>
  api.get<GamePlayerResponse[]>(`/games/players/?game=${gameId}`);

/** Add player to game (assign role/seat) */
export const addPlayerToGame = (data: {
  game: string;
  player: string;
  seat_number: number;
  role?: string;
}) => api.post<GamePlayerResponse>("/games/players/", data);

// =======================
// Standalone Players API
// =======================

/** Get all standalone players (not tied to a specific game) */
export const getPlayers = () => api.get<PlayerResponse[]>("/players/");

/** Create a standalone player */
export const createPlayer = (data: { name: string }) =>
  api.post<PlayerResponse>("/players/", data);

// =======================
// Actions API
// =======================

/** Get all actions for a specific game */
export const getActionsByGame = (gameId: string) =>
  api.get<Action[]>(`/actions/?game=${gameId}`);
