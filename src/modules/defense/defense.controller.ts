import { Request, Response } from "express";
import {
  startDefense,
  getDefenseOrder,
  assignDefend,
  getDefenseStage
} from "./defense.service";
import { logAction } from "../actions/actions.service";
import { autoAdvancePhase } from "../games/games.service";

// 1. Start defense phase
export async function startDefenseController(req: Request, res: Response) {
  try {
    const gameId = parseInt(req.params.gameId);
    const { finalists } = req.body; // array of GamePlayer IDs

    if (!Array.isArray(finalists) || finalists.length === 0) {
      throw new Error("Finalists array is required");
    }

    const result = await startDefense(gameId, finalists);
    res.json({ message: "Defense phase started", result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// 2. Get defense order (by seat)
export async function getDefenseOrderController(req: Request, res: Response) {
  try {
    const gameId = parseInt(req.params.gameId);
    const result = await getDefenseOrder(gameId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// Claim role
export async function claimRoleController(req: Request, res: Response) {
  try {
    const { gamePlayerId, roleName, actionTypeId } = req.body;
    const result = await logAction(gamePlayerId, actionTypeId, [], roleName);

    // No phase advance here (players may chain multiple claims)
    res.json({ message: "Role claimed", result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// Deny role
export async function denyRoleController(req: Request, res: Response) {
  try {
    const { gamePlayerId, roleName, actionTypeId } = req.body;
    const result = await logAction(gamePlayerId, actionTypeId, [], roleName);

    // Auto-advance to defend phase after all denies are done
    await autoAdvancePhase(req.body.gameId);

    res.json({ message: "Role denied", result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// Assign defend
export async function assignDefendController(req: Request, res: Response) {
  try {
    const { finalistId, defendId, gameId } = req.body;
    const result = await assignDefend(finalistId, defendId || null);

    // Auto-advance to final voting after all defends are done
    await autoAdvancePhase(gameId);

    res.json({ message: "Defend player assigned", result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// 5. Show ability action
export async function showAbilityController(req: Request, res: Response) {
  try {
    const { gamePlayerId, roleName, notes, actionTypeId } = req.body;
    if (!roleName || !notes) throw new Error("Role and notes required");

    const result = await logAction(
      gamePlayerId,
      actionTypeId,
      [],
      `${roleName}: ${notes}`
    );
    res.json({ message: "Ability revealed", result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// 7. Get defend stage (finalists + their chosen defend)
export async function getDefendStageController(req: Request, res: Response) {
  try {
    const gameId = parseInt(req.params.gameId);
    const result = await getDefenseStage(gameId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}
