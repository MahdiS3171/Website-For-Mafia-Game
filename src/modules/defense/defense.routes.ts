import { Router } from "express";
import { authenticateJWT } from "../../middleware/authMiddleware";
import {
  startDefenseController,
  getDefenseOrderController,
  claimRoleController,
  denyRoleController,
  showAbilityController,
  assignDefendController,
  getDefendStageController
} from "./defense.controller";

const router = Router();

// Defense phase routes
router.post("/:gameId/start", authenticateJWT, startDefenseController);
router.get("/:gameId/order", authenticateJWT, getDefenseOrderController);

// Claim / Deny / Show ability
router.post("/:gameId/claim", authenticateJWT, claimRoleController);
router.post("/:gameId/deny", authenticateJWT, denyRoleController);
router.post("/:gameId/show-ability", authenticateJWT, showAbilityController);

// Defend assignment routes
router.post("/:gameId/assign-defend", authenticateJWT, assignDefendController);
router.get("/:gameId/defend-stage", authenticateJWT, getDefendStageController);

export default router;
