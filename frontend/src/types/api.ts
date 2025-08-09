// API Types matching Django backend models

export interface Player {
  id: number;
  name: string;
  nickname: string;
  created_at: string;
}

export interface Role {
  id: number;
  name: string;
  description: string | null;
  is_mafia: boolean;
  order: number;
}

export interface Game {
  id: number;
  title: string;
  created_at: string;
  is_active: boolean;
}

export interface GamePlayer {
  id: number;
  game: number;
  player: Player;
  role: Role | null;
  seat_number: number;
}

export interface GameRole {
  id: number;
  game: number;
  role: Role;
  count: number;
}

export interface ActionType {
  id: number;
  name: string;
}

export interface Action {
  id: number;
  game: number;
  action_type: ActionType;
  performer: GamePlayer;
  day_number: number;
  targets: GamePlayer[];
}

export interface Log {
  id: number;
  game: number;
  game_player: GamePlayer;
  action_type: ActionType;
  targets: GamePlayer[];
  phase: 'day' | 'night';
  round_number: number;
  created_at: string;
}

export interface GamePhase {
  id: number;
  game: number;
  phase_type: 'day' | 'night';
  number: number;
  start_time: string;
}

export interface DaySpeech {
  id: number;
  phase: number;
  speaker: GamePlayer;
  order: number;
  content: string;
  started_at: string;
}

// API Response types
export interface ApiResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Frontend specific types
export interface GameWithPlayers extends Game {
  game_players: GamePlayer[];
  player_count: number;
  status: 'completed' | 'in-progress' | 'abandoned';
  winner?: string;
  duration?: string;
} 