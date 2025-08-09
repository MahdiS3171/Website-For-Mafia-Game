// src/lib/api.ts
import axios from "axios";
import {
  GameResponse,
  GamePlayerResponse,
  PlayerResponse,
  Action,
  LogResponse,
  GamePhaseResponse,
  DaySpeechResponse,
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
export const createGame = (data: { is_active?: boolean }) =>
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
  api.get<LogResponse[]>(`/actions/?game=${gameId}`);


// =======================
// Logs API
// =======================

/** Get all logs for a specific game */
export const getLogsByGame = (gameId: string) =>
  api.get<LogResponse[]>(`/logs/?game=${gameId}`);

/** Create a new log entry */
export const createLog = (data: {
  game: string;
  game_player: string;
  action_type: string;
  targets?: { target: string; tag?: string }[];
  phase: "day" | "night";
  round_number: number;
  details?: any;
}) => api.post<LogResponse>("/logs/", data);

// =======================
// Game Phases API
// =======================

/** Get phases (day/night) for a game */
export const getPhasesByGame = (gameId: string) =>
  api.get<GamePhaseResponse[]>(`/logs/phases/?game=${gameId}`);

// =======================
// Day Speeches API
// =======================

/** Get speeches for a specific game phase */
export const getDaySpeeches = (phaseId: string) =>
  api.get<DaySpeechResponse[]>(`/logs/day-speeches/?phase=${phaseId}`);


/** Mark game as complete and set winner */
export const completeGame = (gameId: string, winner: string) =>
  api.post(`/games/${gameId}/complete/`, { winner });