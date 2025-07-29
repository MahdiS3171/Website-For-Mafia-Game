import { Request, Response } from "express";
import { executeNightPhase } from "./night.service";
import prisma from "../../config/db";

export async function executeNightController(req: Request, res: Response) {
  try {
    const gameId = parseInt(req.params.gameId);

    // Extract all night actions from request
    const {
      godfatherShot,
      godfatherSuggest,
      punisherTarget,
      attorneyTarget,
      ordinaryCitizenSuggest,
      killerShot,
      sniperShot,
      doctorHeals,
      boozerTarget,
      nofaceTarget
    } = req.body;

    // Fetch current game to get current day (for logs)
    const game = await prisma.game.findUnique({ where: { game_id: gameId } });
    if (!game) return res.status(404).json({ error: "Game not found" });

    // Call service to process night logic
    const result = await executeNightPhase(gameId, {
      godfatherShot,
      godfatherSuggest,
      punisherTarget,
      attorneyTarget,
      ordinaryCitizenSuggest,
      killerShot,
      sniperShot,
      doctorHeals,
      boozerTarget,
      nofaceTarget
    });

    // Optionally log Noface detection result as an ActionLog entry
    if (nofaceTarget) {
      const nofacePlayer = await prisma.gamePlayer.findFirst({
        where: { game_id: gameId, role: { name: "noface" }, alive: true }
      });

      if (nofacePlayer) {
        await prisma.actionLog.create({
          data: {
            game_id: gameId,
            gamePlayer_id: nofacePlayer.id,
            actionType_id: 0, // replace later with ID for "noface detection"
            day: game.currentDay,
            phase: "night",
            targets: JSON.stringify([nofaceTarget]),
            notes: `Noface checked player ${nofaceTarget}`
          }
        });
      }
    }

    return res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}
