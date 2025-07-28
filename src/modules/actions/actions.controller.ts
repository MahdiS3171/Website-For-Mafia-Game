import { Request, Response } from "express";
import { logAction } from "./actions.service";

export async function logActionController(req: Request, res: Response) {
  try {
    const { gamePlayerId, actionTypeId, targets, notes } = req.body;

    const log = await logAction(gamePlayerId, actionTypeId, targets, notes);
    res.status(201).json(log);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

import {
  createActionType,
  getActionTypes,
  updateActionType,
  deleteActionType
} from "./actions.service";

// Create
export async function createActionTypeController(req: Request, res: Response) {
  try {
    const { name, phase, role_id, description } = req.body;
    const action = await createActionType(name, phase, role_id, description);
    res.status(201).json(action);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

// Get all
export async function getActionTypesController(req: Request, res: Response) {
  try {
    const actions = await getActionTypes();
    res.json(actions);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

// Update
export async function updateActionTypeController(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    const { name, phase, role_id, description } = req.body;
    const updated = await updateActionType(id, name, phase, role_id, description);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

// Delete
export async function deleteActionTypeController(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    await deleteActionType(id);
    res.json({ message: "Action type deleted" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

import { getAvailableActionsForPlayer } from "./actions.service";

export async function getAvailableActionsController(req: Request, res: Response) {
  try {
    const gamePlayerId = parseInt(req.params.id);
    const actions = await getAvailableActionsForPlayer(gamePlayerId);
    res.json(actions);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

import { assignActionsToRole } from "./actions.service";

export async function assignActionsToRoleController(req: Request, res: Response) {
  try {
    const roleId = parseInt(req.params.id);
    const { actionIds } = req.body;

    if (!Array.isArray(actionIds)) {
      return res.status(400).json({ message: "actionIds must be an array" });
    }

    const updatedActions = await assignActionsToRole(roleId, actionIds);
    res.json(updatedActions);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}


import { denyRole } from "./actions.service";

export async function denyRoleController(req: Request, res: Response) {
  try {
    const gamePlayerId = parseInt(req.body.gamePlayerId);
    const roleId = parseInt(req.body.roleId);

    const result = await denyRole(gamePlayerId, roleId);
    res.json({ message: "Deny role action recorded", result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

