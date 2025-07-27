import { Request, Response } from "express";
import { createGame,
   addPlayersToGame,
   getGameDetails,
   updateRemovalInfo,
   updateWinStatus,
   autoRemovePlayer,
   endGameAndSetWinners,
   advancePhase,
   autoAdvancePhase
 } from "./games.service";

// Create a new game
export async function createGameController(req: Request, res: Response) {
  try {
    const game = await createGame();
    res.status(201).json(game);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

// Add players to game
export async function addPlayersController(req: Request, res: Response) {
  try {
    const gameId = parseInt(req.params.id);
    const players = req.body.players;

    if (!Array.isArray(players) || players.length === 0) {
      return res.status(400).json({ message: "Players array required" });
    }

    const gamePlayers = await addPlayersToGame(gameId, players);
    res.status(201).json(gamePlayers);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

// Get game details
export async function getGameController(req: Request, res: Response) {
  try {
    const gameId = parseInt(req.params.id);
    const game = await getGameDetails(gameId);

    if (!game) return res.status(404).json({ message: "Game not found" });
    res.json(game);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

import { assignRoleToPlayer, updatePlayerStatus } from "./games.service";

// Assign role to player in game
export async function assignRoleController(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id); // gamePlayer ID
    const { role_id } = req.body;

    const updated = await assignRoleToPlayer(id, role_id);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

// Update alive/terminated status
export async function updatePlayerStatusController(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id); // gamePlayer ID
    const { alive } = req.body;

    const updated = await updatePlayerStatus(id, alive);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function markPlayerRemovedController(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id); // gamePlayer ID
    const { removedAt } = req.body;

    const updated = await updateRemovalInfo(id, removedAt);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

export async function markPlayerWinController(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id); // gamePlayer ID
    const { won } = req.body;

    const updated = await updateWinStatus(id, won);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

export async function autoRemovePlayerController(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id); // gamePlayer ID
    const { cause } = req.body;

    const updated = await autoRemovePlayer(id, cause);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

export async function endGameController(req: Request, res: Response) {
  try {
    const gameId = parseInt(req.params.id);
    const { winningSide } = req.body; // "citizen" or "mafia"

    const result = await endGameAndSetWinners(gameId, winningSide);
    res.json({ message: "Game ended and winners set", result });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

export async function advancePhaseController(req: Request, res: Response) {
  try {
    const gameId = parseInt(req.params.id);
    const updatedGame = await advancePhase(gameId);
    res.json({
      message: `Phase advanced to ${updatedGame.currentPhase}, Day ${updatedGame.currentDay}`,
      game: updatedGame,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

import { generateSeats } from "./games.service";

export async function generateSeatsController(req: Request, res: Response) {
  try {
    const gameId = parseInt(req.params.id);
    const { startingPlayerId } = req.body;

    const seats = await generateSeats(gameId, startingPlayerId);
    res.json(seats);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}


import { finalizeWillPhase } from "./games.service";

export async function finalizeWillController(req: Request, res: Response) {
  try {
    const gameId = parseInt(req.params.id);
    const updatedGame = await finalizeWillPhase(gameId);
    res.json(updatedGame);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

export async function autoAdvancePhaseController(req: Request, res: Response) {
  try {
    const gameId = parseInt(req.params.id);
    const result = await autoAdvancePhase(gameId);
    res.json({ message: "Phase advanced", result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

