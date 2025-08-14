// =======================
// Player Types
// =======================
export interface Player {
  id: string;
  name: string;
  // Players can exist independently; role/seat assigned via GamePlayer
}

// =======================
// Game Role Types
// =======================
export interface GameRole {
  id: string;
  game: string;       // Game ID
  role: string;       // Role name or ID
  count: number;      // How many players have this role
}

// =======================
// GamePlayer Types
// =======================
export interface GamePlayer {
  id: string;
  game: string;        // Game ID
  player: string;      // Player ID
  role?: string;       // Role name or ID (optional)
  seat_number: number; // Seat number in the game
}

// =======================
// Game Types
// =======================
export interface Game {
  id: string;
  date: string;        // maps to created_at in backend
  status: "completed" | "in-progress"; // derived from is_active
  is_active: boolean;
  players?: NestedPlayer[];
}

export interface NestedPlayer {
  id: string;                     // game_player id
  name: string;
  role?: string;
  seat_number: number;

  // optional extras from backend (safe for TS even if backend doesn't send them)
  player_id?: string;
  nickname?: string | null;
  role_slug?: string;
  is_eliminated?: boolean;
  is_alive?: boolean;
  eliminated_at?: string | null;
}

// =======================
// API Response Types
// =======================
export interface GameResponse {
  id: string;
  title: string;
  winner: string;
  date: string;
  status: string;
  is_active: boolean;
  current_phase: "day" | "night";
  round_number: number;
  players: NestedPlayer[];
}


export interface PlayerResponse {
  id: string;
  name: string;
  nickname: string;
}

export interface GamePlayerResponse {
  id: string;
  game: string;
  player: string;
  role?: string;
  seat_number: number;
}

// =======================
// Action Types
// =======================
export interface Action {
  id: string;          // unique ID of the action
  game: string;        // game ID
  player: string;      // player ID (who performed the action)
  type: string;        // e.g., "vote", "kill", "protect"
  target?: string;     // ID of the target player (if any)
  timestamp: string;   // ISO date string
}

// =======================
// Log Types (for Results page)
// =======================
export interface LogTargetDTO {
  target: string;       // GamePlayer ID
  player_name?: string;  // Convenience name of the player
  tag?: string;         // Optional tag describing the relation (e.g. "guard")
}

export interface LogResponse {
  id: string;
  game: string;
  game_player: string;
  player_name?: string;    // populated on GET
  action_type: string;     // slug
  targets: LogTargetDTO[];
  phase: "day" | "night";
  round_number: number;
  details?: any;
  created_at: string;
}


export interface GamePhaseResponse {
  id: string;
  game: string;
  phase_type: "day" | "night";
  number: number;
  start_time: string;
}

export interface DaySpeechResponse {
  id: string;
  phase: string;           // Phase ID
  speaker: string;         // GamePlayer ID
  order: number;
  content: string;
  started_at: string;
}


export type ListResult<T> = T[] | { results: T[]; count?: number; next?: string | null; previous?: string | null };
export type TagSpec = { key: string; label: string };
export type ParamSpec = { type: 'int' | 'string'; required?: boolean; min?: number; max?: number };

export interface ActionTypeDTO {
  id: number | string;
  name: string;
  slug: string;
  phase: 'day' | 'night';
  config: {
    tags?: (string | TagSpec)[];         // backend accepts both; we’ll normalize to TagSpec[]
    item_label?: string;
    params?: Record<string, ParamSpec>;
    details_schema?: Record<string, any>;
    requires_targets?: boolean;
    allow_self?: boolean;
    separate_per_target?: boolean;
    separatePerTarget?: boolean;         // legacy
    derive_n_from_targets?: boolean;
  };
}

export interface ActionResponse {
  id: string | number;
  game: string | number;
  action_type: string;           // slug, e.g., "target"
  performer: string | number;    // GamePlayer id
  // depending on your migrations, one or more of these may exist:
  round_number?: number | null;
  day_number?: number | null;
  phase?: "day" | "night" | null;
  targets: any;                  // often array of { target, tag }, keep as any if JSON
  details?: any;
  created_at?: string;
}

export type PlayerWithStats = {
  id: number | string;
  name: string;
  nickname?: string | null;
  games_played: number;
  wins: number;
  win_rate: number;
};