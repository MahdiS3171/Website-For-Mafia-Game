import { Router } from "express";
import { authenticateJWT } from "../../middleware/authMiddleware";
import {
  claimRoleController,
  denyRoleController,
  showAbilityController,
  getClaimsByPhaseController
} from "./roleClaims.controller";

const router = Router();

router.post("/claim", authenticateJWT, claimRoleController);
router.post("/deny", authenticateJWT, denyRoleController);
router.post("/show", authenticateJWT, showAbilityController);
router.get("/:gameId/:phase", authenticateJWT, getClaimsByPhaseController);

export default router;
