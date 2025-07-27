import { Request, Response } from "express";
import { createRole, getAllRoles, getRolesInGame } from "./roles.service";

export async function createRoleController(req: Request, res: Response) {
  try {
    const { name, tag, description } = req.body;

    if (!name || !tag) {
      return res.status(400).json({ message: "Name and tag are required" });
    }

    const role = await createRole(name, tag, description);
    res.status(201).json(role);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function getAllRolesController(req: Request, res: Response) {
  try {
    const roles = await getAllRoles();
    res.json(roles);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function getRolesInGameController(req: Request, res: Response) {
  try {
    const gameId = parseInt(req.params.id);
    const roles = await getRolesInGame(gameId);
    res.json(roles);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

import { updateRole, deleteRole } from "./roles.service";

// Update role
export async function updateRoleController(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);
    const { name, tag, description } = req.body;

    const role = await updateRole(id, name, tag, description);
    res.json(role);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

// Delete role
export async function deleteRoleController(req: Request, res: Response) {
  try {
    const id = parseInt(req.params.id);

    await deleteRole(id);
    res.json({ message: "Role deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
