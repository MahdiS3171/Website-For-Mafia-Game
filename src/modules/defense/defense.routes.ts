import { Router } from "express";
import { authenticateJWT } from "../../middleware/authMiddleware";
import {
  startDefenseController,
  getDefenseOrderController,
  claimRoleController,
  denyRoleController,
  showAbilityController,
  assignDefendController,
  getDefendOrderController
} from "./defense.controller";

const router = Router();

// Defense phase routes
router.post("/:gameId/start", authenticateJWT, startDefenseController);
router.get("/:gameId/order", authenticateJWT, getDefenseOrderController);

// Claim / Deny / Show
router.post("/:gameId/claim", authenticateJWT, claimRoleController);
router.post("/:gameId/deny", authenticateJWT, denyRoleController);
router.post("/:gameId/show-ability", authenticateJWT, showAbilityController);

// Defend phase routes
router.post("/:gameId/assign-defend", authenticateJWT, assignDefendController);
router.get("/:gameId/defend-order", authenticateJWT, getDefendOrderController);

export default router;
