// src/lib/api.ts
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
});

// Example helper methods
export const getGames = () => api.get("/games/");
export const createGame = (data: any) => api.post("/games/", data);
export const addPlayer = (data: any) => api.post("/players/", data);
export const getGameDetails = (id: string) => api.get(`/games/${id}/`);
export const getGameResults = (id: string) => api.get(`/games/${id}/results/`);
