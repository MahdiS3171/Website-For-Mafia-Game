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
export interface TargetInfo {
  target: string;       // GamePlayer ID
  player_name: string;  // Convenience name of the player
  tag?: string;         // Optional tag describing the relation (e.g. "guard")
}

export interface LogResponse {
  id: string;
  game: string;           // Game ID
  game_player: string;    // Player ID (actor)
  action_type: { id: string; name: string } | string; // Action type info
  targets: TargetInfo[];  // Detailed target information
  phase: "day" | "night";
  round_number: number;
  details?: any;          // Additional info (k/n, chosen role, ...)
  created_at: string;     // ISO timestamp
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


// =======================
// ActionType (from backend)
// =======================
export interface ActionType {
  id: string;
  name: string;
  slug: string;
  phase: "day" | "night";
  config: {
    tags?: string[];
    separatePerTarget?: boolean;
    multi?: boolean;
    choose_role?: boolean;
    composite?: string[];
    params?: string[];
  };
}
