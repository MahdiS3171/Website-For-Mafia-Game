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
  PlayerWithStats,
} from "../types";

import type { ActionResponse } from "../types";
import type { ListResult, ActionTypeDTO } from "../types";

type ActionTypesWire =
  | ActionTypeDTO[]
  | { results: ActionTypeDTO[] }
  | { data: ActionTypeDTO[] };

// =======================
// API Setup
// =======================
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
  withCredentials: false,
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
export const createGame = ( data: { title: string; is_active?: boolean }) =>
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

/** Create a standalone player */
export const createPlayer = (data: { name: string, nickname?: string }) =>
  api.post<PlayerResponse>("/players/", data);

// =======================
// Actions API
// =======================

/** Get all actions for a specific game */

export const getActionsByGame = (gameId: string) =>
  api.get<ActionResponse[]>(`/actions/?game=${gameId}`);

// === Action Types ===
export async function getActionTypes(): Promise<ActionTypeDTO[]> {
  const res = await api.get<ActionTypesWire>("/actions/types/");
  const d = res.data;

  if (Array.isArray(d)) return d;
  if (d && "results" in d && Array.isArray(d.results)) return d.results;
  if (d && "data" in d && Array.isArray(d.data)) return d.data;
  return [];
}


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
  day_turn?: string | number;
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

export const advancePhase = (gameId: string) =>
  api.post(`/games/${gameId}/advance_phase/`);

export const terminatePlayers = (gameId: string, ids: string[]) =>
  api.post(`/games/${gameId}/terminate_players/`, ids); // raw array, not { ids }


export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}

const saved = localStorage.getItem("token");
if (saved) setAuthToken(saved);


// optional: auto-refresh access token
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err?.response?.status === 401) {
      const refresh = localStorage.getItem("refreshToken");
      if (!refresh) return Promise.reject(err);
      try {
        const r = await api.post<{ access: string }>("/accounts/token/refresh/", { refresh });
        localStorage.setItem("token", r.data.access);
        setAuthToken(r.data.access);
        err.config.headers["Authorization"] = `Bearer ${r.data.access}`;
        return api.request(err.config);
      } catch (e) {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        setAuthToken(null);
        return Promise.reject(e);
      }
    }
    return Promise.reject(err);
  }
);

// Get all roles (expects id, name, slug, is_mafia)
export const getRoles = () => api.get<RoleDTO[]>("/roles/");
// Bulk add players to a game in one request
export const bulkAddPlayersToGame = (
  gameId: string,
  rows: { name?: string; nickname?: string; player_id?: string; seat_number: number; role_slug: string }[]
) => api.post<{ ok: boolean; count: number }>(`/games/${gameId}/bulk_add_players/`, rows);


export const getPlayers = (search = "", limit = 50) =>
  api.get<any>("/players/", {
    params: search ? { search, page_size: limit } : { page_size: limit },
});


export type RoleDTO = { id: string; name: string; slug: string; is_mafia: boolean };


export type DayTurnDTO = {
  id: string | number;
  game: string | number;
  round_number: number;
  index: number;
  actor: string | number;
  actor_name?: string;
  opened_at: string;
  closed_at: string | null;
};

export const startTurn = (game: string | number, actor: string | number) =>
  api.post<DayTurnDTO>("/logs/turns/start/", { game, actor });

export const endTurn = (turnId: string | number) =>
  api.post<DayTurnDTO>(`/logs/turns/${turnId}/end/`, {});

export const getCurrentTurn = (game: string | number) =>
  api.get<DayTurnDTO | void>(`/logs/turns/current/?game=${game}`);


// List with stats
export const listPlayersWithStats = () =>
  api.get<PlayerWithStats[]>("/players/?with_stats=1");

// Update player (name / nickname)
export const updatePlayer = (id: string | number, payload: { name?: string; nickname?: string | null }) =>
  api.patch(`/players/${id}/`, payload);



export const deleteLog = (id: string | number) =>
  api.delete(`/logs/${id}/`);
export const deleteGame = (id: string | number) =>
  api.delete(`/games/${id}/`);