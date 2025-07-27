import { Request, Response } from "express";
import {
  startDefense,
  getDefenseOrder,
  assignDefend,
  getDefendOrder
} from "./defense.service";
import { logAction } from "../actions/actions.service";

// 1. Start defense phase
export async function startDefenseController(req: Request, res: Response) {
  try {
    const gameId = parseInt(req.params.gameId);
    const { finalists } = req.body; // array of GamePlayer IDs

    const result = await startDefense(gameId, finalists);
    res.json({ message: "Defense phase started", result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// 2. Get defense order
export async function getDefenseOrderController(req: Request, res: Response) {
  try {
    const gameId = parseInt(req.params.gameId);
    const result = await getDefenseOrder(gameId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// 3. Claim role
export async function claimRoleController(req: Request, res: Response) {
  try {
    const { gamePlayerId, roleName, actionTypeId } = req.body;
    const result = await logAction(gamePlayerId, actionTypeId, [], roleName);
    res.json({ message: "Role claimed", result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// 4. Deny role
export async function denyRoleController(req: Request, res: Response) {
  try {
    const { gamePlayerId, roleName, actionTypeId } = req.body;
    const result = await logAction(gamePlayerId, actionTypeId, [], roleName);
    res.json({ message: "Role denied", result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// 5. Show ability
export async function showAbilityController(req: Request, res: Response) {
  try {
    const { gamePlayerId, roleName, notes, actionTypeId } = req.body;
    const result = await logAction(gamePlayerId, actionTypeId, [], `${roleName}: ${notes}`);
    res.json({ message: "Ability revealed", result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// 6. Assign defend player
export async function assignDefendController(req: Request, res: Response) {
  try {
    const { finalistId, defendId } = req.body;
    const result = await assignDefend(finalistId, defendId || null);
    res.json({ message: "Defend player assigned", result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// 7. Get defend order
export async function getDefendOrderController(req: Request, res: Response) {
  try {
    const gameId = parseInt(req.params.gameId);
    const result = await getDefendOrder(gameId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}
