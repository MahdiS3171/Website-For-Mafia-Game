import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  gamesApi, 
  playersApi, 
  rolesApi, 
  gamePlayersApi, 
  actionsApi, 
  actionTypesApi, 
  logsApi 
} from '../services/api';
import { Game, Player, Role, GamePlayer, Action, Log, ActionType } from '../types/api';

// Games hooks
export const useGames = () => {
  return useQuery({
    queryKey: ['games'],
    queryFn: gamesApi.getAll,
  });
};

export const useGame = (id: number) => {
  return useQuery({
    queryKey: ['games', id],
    queryFn: () => gamesApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateGame = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: gamesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] });
    },
  });
};

export const useUpdateGame = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Game> }) => 
      gamesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['games'] });
      queryClient.invalidateQueries({ queryKey: ['games', id] });
    },
  });
};

export const useDeleteGame = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: gamesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] });
    },
  });
};

// Players hooks
export const usePlayers = () => {
  return useQuery({
    queryKey: ['players'],
    queryFn: playersApi.getAll,
  });
};

export const usePlayer = (id: number) => {
  return useQuery({
    queryKey: ['players', id],
    queryFn: () => playersApi.getById(id),
    enabled: !!id,
  });
};

export const useCreatePlayer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: playersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
    },
  });
};

export const useUpdatePlayer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Player> }) => 
      playersApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      queryClient.invalidateQueries({ queryKey: ['players', id] });
    },
  });
};

export const useDeletePlayer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: playersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
    },
  });
};

// Roles hooks
export const useRoles = () => {
  return useQuery({
    queryKey: ['roles'],
    queryFn: rolesApi.getAll,
  });
};

export const useRole = (id: number) => {
  return useQuery({
    queryKey: ['roles', id],
    queryFn: () => rolesApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: rolesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Role> }) => 
      rolesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['roles', id] });
    },
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: rolesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
};

// Game Players hooks
export const useGamePlayers = (gameId?: number) => {
  return useQuery({
    queryKey: ['game-players', gameId],
    queryFn: () => gameId ? gamePlayersApi.getByGame(gameId) : gamePlayersApi.getAll(),
    enabled: gameId !== undefined,
  });
};

export const useGamePlayer = (id: number) => {
  return useQuery({
    queryKey: ['game-players', id],
    queryFn: () => gamePlayersApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateGamePlayer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: gamePlayersApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['game-players'] });
      queryClient.invalidateQueries({ queryKey: ['game-players', data.game] });
    },
  });
};

export const useUpdateGamePlayer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<GamePlayer> }) => 
      gamePlayersApi.update(id, data),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['game-players'] });
      queryClient.invalidateQueries({ queryKey: ['game-players', id] });
      queryClient.invalidateQueries({ queryKey: ['game-players', data.game] });
    },
  });
};

export const useDeleteGamePlayer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: gamePlayersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game-players'] });
    },
  });
};

// Actions hooks
export const useActions = (gameId?: number) => {
  return useQuery({
    queryKey: ['actions', gameId],
    queryFn: () => gameId ? actionsApi.getByGame(gameId) : actionsApi.getAll(),
    enabled: gameId !== undefined,
  });
};

export const useAction = (id: number) => {
  return useQuery({
    queryKey: ['actions', id],
    queryFn: () => actionsApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateAction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: actionsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['actions'] });
      queryClient.invalidateQueries({ queryKey: ['actions', data.game] });
    },
  });
};

export const useUpdateAction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Action> }) => 
      actionsApi.update(id, data),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['actions'] });
      queryClient.invalidateQueries({ queryKey: ['actions', id] });
      queryClient.invalidateQueries({ queryKey: ['actions', data.game] });
    },
  });
};

export const useDeleteAction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: actionsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actions'] });
    },
  });
};

// Action Types hooks
export const useActionTypes = () => {
  return useQuery({
    queryKey: ['action-types'],
    queryFn: actionTypesApi.getAll,
  });
};

export const useActionType = (id: number) => {
  return useQuery({
    queryKey: ['action-types', id],
    queryFn: () => actionTypesApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateActionType = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: actionTypesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['action-types'] });
    },
  });
};

export const useUpdateActionType = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ActionType> }) => 
      actionTypesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['action-types'] });
      queryClient.invalidateQueries({ queryKey: ['action-types', id] });
    },
  });
};

export const useDeleteActionType = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: actionTypesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['action-types'] });
    },
  });
};

// Logs hooks
export const useLogs = (gameId?: number) => {
  return useQuery({
    queryKey: ['logs', gameId],
    queryFn: () => gameId ? logsApi.getByGame(gameId) : logsApi.getAll(),
    enabled: gameId !== undefined,
  });
};

export const useLog = (id: number) => {
  return useQuery({
    queryKey: ['logs', id],
    queryFn: () => logsApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateLog = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: logsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['logs'] });
      queryClient.invalidateQueries({ queryKey: ['logs', data.game] });
    },
  });
};

export const useUpdateLog = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Log> }) => 
      logsApi.update(id, data),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['logs'] });
      queryClient.invalidateQueries({ queryKey: ['logs', id] });
      queryClient.invalidateQueries({ queryKey: ['logs', data.game] });
    },
  });
};

export const useDeleteLog = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: logsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs'] });
    },
  });
}; 