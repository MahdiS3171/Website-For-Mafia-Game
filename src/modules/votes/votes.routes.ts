import { Router } from "express";
import { authenticateJWT } from "../../middleware/authMiddleware";
import {
  castInitialVotesController,
  castFinalVoteController,
  getVoteTallyController,
  determineFinalistsController
} from "./votes.controller";

const router = Router();

router.post("/:id/initial", authenticateJWT, castInitialVotesController);
router.post("/:id/final", authenticateJWT, castFinalVoteController);
router.get("/:id/tally", authenticateJWT, getVoteTallyController);
router.post("/:id/finalists", authenticateJWT, determineFinalistsController);

export default router;
