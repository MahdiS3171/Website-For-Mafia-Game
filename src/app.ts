import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

import authRoutes from "./modules/auth/auth.routes";
app.use("/auth", authRoutes);

import playerRoutes from "./modules/players/players.routes";
app.use("/players", playerRoutes);

import gameRoutes from "./modules/games/games.routes";
app.use("/games", gameRoutes);

import roleRoutes from "./modules/roles/roles.routes";
app.use("/roles", roleRoutes);

import actionRoutes from "./modules/actions/actions.routes";
app.use("/actions", actionRoutes);

import votesRoutes from "./modules/votes/votes.routes";
app.use("/votes", votesRoutes);

import defenseRoutes from "./modules/defense/defense.routes";
app.use("/defense", defenseRoutes);

export default app;
