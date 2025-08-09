import { Game, Player, Role, GamePlayer, Action, Log, ActionType, ApiResponse } from '../types/api';

const API_BASE_URL = 'http://localhost:8000';

// Generic API functions
async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Games API
export const gamesApi = {
  getAll: (): Promise<ApiResponse<Game>> => 
    apiRequest<ApiResponse<Game>>('/api/games/'),
  
  getById: (id: number): Promise<Game> => 
    apiRequest<Game>(`/api/games/${id}/`),
  
  create: (data: Partial<Game>): Promise<Game> => 
    apiRequest<Game>('/api/games/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: number, data: Partial<Game>): Promise<Game> => 
    apiRequest<Game>(`/api/games/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: number): Promise<void> => 
    apiRequest<void>(`/api/games/${id}/`, {
      method: 'DELETE',
    }),
};

// Players API
export const playersApi = {
  getAll: (): Promise<ApiResponse<Player>> => 
    apiRequest<ApiResponse<Player>>('/api/players/'),
  
  getById: (id: number): Promise<Player> => 
    apiRequest<Player>(`/api/players/${id}/`),
  
  create: (data: Partial<Player>): Promise<Player> => 
    apiRequest<Player>('/api/players/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: number, data: Partial<Player>): Promise<Player> => 
    apiRequest<Player>(`/api/players/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: number): Promise<void> => 
    apiRequest<void>(`/api/players/${id}/`, {
      method: 'DELETE',
    }),
};

// Roles API
export const rolesApi = {
  getAll: (): Promise<ApiResponse<Role>> => 
    apiRequest<ApiResponse<Role>>('/api/roles/'),
  
  getById: (id: number): Promise<Role> => 
    apiRequest<Role>(`/api/roles/${id}/`),
  
  create: (data: Partial<Role>): Promise<Role> => 
    apiRequest<Role>('/api/roles/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: number, data: Partial<Role>): Promise<Role> => 
    apiRequest<Role>(`/api/roles/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: number): Promise<void> => 
    apiRequest<void>(`/api/roles/${id}/`, {
      method: 'DELETE',
    }),
};

// Game Players API
export const gamePlayersApi = {
  getAll: (): Promise<ApiResponse<GamePlayer>> => 
    apiRequest<ApiResponse<GamePlayer>>('/api/game-players/'),
  
  getByGame: (gameId: number): Promise<ApiResponse<GamePlayer>> => 
    apiRequest<ApiResponse<GamePlayer>>(`/api/game-players/?game=${gameId}`),
  
  getById: (id: number): Promise<GamePlayer> => 
    apiRequest<GamePlayer>(`/api/game-players/${id}/`),
  
  create: (data: Partial<GamePlayer>): Promise<GamePlayer> => 
    apiRequest<GamePlayer>('/api/game-players/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: number, data: Partial<GamePlayer>): Promise<GamePlayer> => 
    apiRequest<GamePlayer>(`/api/game-players/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: number): Promise<void> => 
    apiRequest<void>(`/api/game-players/${id}/`, {
      method: 'DELETE',
    }),
};

// Actions API
export const actionsApi = {
  getAll: (): Promise<ApiResponse<Action>> => 
    apiRequest<ApiResponse<Action>>('/api/actions/'),
  
  getByGame: (gameId: number): Promise<ApiResponse<Action>> => 
    apiRequest<ApiResponse<Action>>(`/api/actions/?game=${gameId}`),
  
  getById: (id: number): Promise<Action> => 
    apiRequest<Action>(`/api/actions/${id}/`),
  
  create: (data: Partial<Action>): Promise<Action> => 
    apiRequest<Action>('/api/actions/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: number, data: Partial<Action>): Promise<Action> => 
    apiRequest<Action>(`/api/actions/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: number): Promise<void> => 
    apiRequest<void>(`/api/actions/${id}/`, {
      method: 'DELETE',
    }),
};

// Action Types API
export const actionTypesApi = {
  getAll: (): Promise<ApiResponse<ActionType>> => 
    apiRequest<ApiResponse<ActionType>>('/api/action-types/'),
  
  getById: (id: number): Promise<ActionType> => 
    apiRequest<ActionType>(`/api/action-types/${id}/`),
  
  create: (data: Partial<ActionType>): Promise<ActionType> => 
    apiRequest<ActionType>('/api/action-types/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: number, data: Partial<ActionType>): Promise<ActionType> => 
    apiRequest<ActionType>(`/api/action-types/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: number): Promise<void> => 
    apiRequest<void>(`/api/action-types/${id}/`, {
      method: 'DELETE',
    }),
};

// Logs API
export const logsApi = {
  getAll: (): Promise<ApiResponse<Log>> => 
    apiRequest<ApiResponse<Log>>('/api/logs/'),
  
  getByGame: (gameId: number): Promise<ApiResponse<Log>> => 
    apiRequest<ApiResponse<Log>>(`/api/logs/?game=${gameId}`),
  
  getById: (id: number): Promise<Log> => 
    apiRequest<Log>(`/api/logs/${id}/`),
  
  create: (data: Partial<Log>): Promise<Log> => 
    apiRequest<Log>('/api/logs/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: number, data: Partial<Log>): Promise<Log> => 
    apiRequest<Log>(`/api/logs/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: number): Promise<void> => 
    apiRequest<void>(`/api/logs/${id}/`, {
      method: 'DELETE',
    }),
}; 