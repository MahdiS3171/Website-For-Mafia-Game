import { Router } from "express";
import {
  addPlayerController,
  searchPlayersController,
  getPlayerController,
} from "./players.controller";
import { authenticateJWT } from "../../middleware/authMiddleware";

const router = Router();

// Protected routes
router.post("/", authenticateJWT, addPlayerController);
router.get("/search", authenticateJWT, searchPlayersController);
router.get("/:id", authenticateJWT, getPlayerController);


export default router;
