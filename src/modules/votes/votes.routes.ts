import { Router } from "express";
import { authenticateJWT } from "../../middleware/authMiddleware";
import {
  castInitialVotesController,
  initialTallyController,
  determineFinalistsController,
  castFinalVoteController,
  finalTallyController,
  resolveFinalTieController
} from "./votes.controller";

const router = Router();

// Initial voting
router.post("/:gameId/initial", authenticateJWT, castInitialVotesController);
router.get("/:gameId/initial-tally", authenticateJWT, initialTallyController);
router.get("/:gameId/finalists", authenticateJWT, determineFinalistsController);

// Final voting
router.post("/:gameId/final", authenticateJWT, castFinalVoteController);
router.get("/:gameId/final-tally", authenticateJWT, finalTallyController);
router.post("/:gameId/final-resolve", authenticateJWT, resolveFinalTieController);

export default router;
