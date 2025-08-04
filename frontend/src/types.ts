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
// Nested Player Type (used in Game details)
// =======================
export interface NestedPlayer {
  id: string;
  name: string;
  role?: string;
  seat_number: number;
  game?: string;       // Optional: some endpoints include game ID
}

// =======================
// Game Types
// =======================
export interface Game {
  id: string;
  date: string;        // maps to created_at in backend
  is_active: boolean;  // true = ongoing, false = completed
  players?: NestedPlayer[];
}

// Unified response type for both single and list game fetches
export interface GameResponse extends Game {}

// =======================
// Player API Response
// =======================
export interface PlayerResponse {
  id: string;
  name: string;
}

// =======================
// GamePlayer API Response
// =======================
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
