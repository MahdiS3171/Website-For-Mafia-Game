import { Request, Response } from "express";
import { claimRole, denyRole, showAbility, getClaimsByPhase } from "./roleClaims.service";

export async function claimRoleController(req: Request, res: Response) {
  try {
    const { gameId, gamePlayerId, roleId, phase } = req.body;
    const claim = await claimRole(gameId, gamePlayerId, roleId, phase);
    res.json(claim);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function denyRoleController(req: Request, res: Response) {
  try {
    const { gameId, gamePlayerId, roleId, phase } = req.body;
    const deny = await denyRole(gameId, gamePlayerId, roleId, phase);
    res.json(deny);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function showAbilityController(req: Request, res: Response) {
  try {
    const { roleClaimId, description } = req.body;
    const updated = await showAbility(roleClaimId, description);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function getClaimsByPhaseController(req: Request, res: Response) {
  try {
    const { gameId, phase } = req.params;
    const claims = await getClaimsByPhase(parseInt(gameId), phase);
    res.json(claims);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}
