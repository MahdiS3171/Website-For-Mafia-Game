import { Router } from "express";
import { authenticateJWT } from "../../middleware/authMiddleware";
import { executeNightController } from "./night.controller";

const router = Router();

// Endpoint to execute all night actions
router.post("/:gameId/execute", authenticateJWT, executeNightController);

export default router;
