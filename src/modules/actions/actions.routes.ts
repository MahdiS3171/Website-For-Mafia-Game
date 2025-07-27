import { Router } from "express";
import { authenticateJWT } from "../../middleware/authMiddleware";
import { logActionController } from "./actions.controller";

const router = Router();

router.post("/", authenticateJWT, logActionController);
import {
  createActionTypeController,
  getActionTypesController,
  updateActionTypeController,
  deleteActionTypeController
} from "./actions.controller";
import { getAvailableActionsController } from "./actions.controller";

// CRUD for action types
router.post("/types", authenticateJWT, createActionTypeController);
router.get("/types", authenticateJWT, getActionTypesController);
router.patch("/types/:id", authenticateJWT, updateActionTypeController);
router.delete("/types/:id", authenticateJWT, deleteActionTypeController);
router.get("/available/:id", authenticateJWT, getAvailableActionsController);
import { assignActionsToRoleController } from "./actions.controller";

// Assign multiple actions to a specific role
router.patch("/assign-to-role/:id", authenticateJWT, assignActionsToRoleController);




export default router;
