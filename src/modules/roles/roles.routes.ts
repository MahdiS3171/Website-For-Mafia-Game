import { Router } from "express";
import { createRoleController, getAllRolesController, getRolesInGameController, updateRoleController, deleteRoleController } from "./roles.controller";
import { authenticateJWT } from "../../middleware/authMiddleware";

const router = Router();

router.post("/", authenticateJWT, createRoleController);
router.get("/", authenticateJWT, getAllRolesController);
router.get("/game/:id", authenticateJWT, getRolesInGameController);
router.patch("/:id", authenticateJWT, updateRoleController);
router.delete("/:id", authenticateJWT, deleteRoleController);


export default router;
