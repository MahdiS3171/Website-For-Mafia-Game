import { Router } from "express";
import { authenticateJWT } from "../../middleware/authMiddleware";
import {
  createGameController,
  addPlayersController,
  getGameController,
  assignRoleController,
  updatePlayerStatusController,
  markPlayerRemovedController,
  markPlayerWinController,
  endGameController,
  autoRemovePlayerController,
  advancePhaseController,
  generateSeatsController,
  finalizeWillController,
  autoAdvancePhaseController
} from "./games.controller";

const router = Router();

router.post("/", authenticateJWT, createGameController);
router.post("/:id/players", authenticateJWT, addPlayersController);
router.get("/:id", authenticateJWT, getGameController);
router.patch("/players/:id/role", authenticateJWT, assignRoleController);
router.patch("/players/:id/status", authenticateJWT, updatePlayerStatusController);
router.patch("/players/:id/removed", authenticateJWT, markPlayerRemovedController);
router.patch("/players/:id/win", authenticateJWT, markPlayerWinController);
router.patch("/:id/end", authenticateJWT, endGameController);
router.patch("/players/:id/remove", authenticateJWT, autoRemovePlayerController);
router.patch("/:id/advance-phase", authenticateJWT, advancePhaseController);
router.post("/:id/seats", authenticateJWT, generateSeatsController);
router.post("/:id/finalize-will", authenticateJWT, finalizeWillController);
router.patch("/:id/auto-advance", authenticateJWT, autoAdvancePhaseController);




export default router;
