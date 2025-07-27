import { Request, Response } from "express";
import { createPlayer, searchPlayers, getPlayerById } from "./players.service";

// Add a new player
export async function addPlayerController(req: Request, res: Response) {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });

    const player = await createPlayer(name);
    res.status(201).json(player);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

// Search players
export async function searchPlayersController(req: Request, res: Response) {
  try {
    const query = req.query.q as string;
    if (!query) return res.status(400).json({ message: "Query is required" });

    const players = await searchPlayers(query);
    res.json(players);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

// Get player by ID
export async function getPlayerController(req: Request, res: Response) {
  try {
    const playerId = parseInt(req.params.id);
    const player = await getPlayerById(playerId);

    if (!player) return res.status(404).json({ message: "Player not found" });
    res.json(player);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}
