import { Request, Response } from "express";
import {
  castInitialVotes,
  castFinalVote,
  getVoteTally,
  determineFinalists,
  tallyFinalVotes,
  eliminateFinalist
} from "./votes.service";
import { autoAdvancePhase } from "../games/games.service"; // <-- Import

// ------------------- INITIAL VOTING -------------------

// Get tally for initial voting
export async function initialTallyController(req: Request, res: Response) {
  try {
    const gameId = parseInt(req.params.gameId);
    const result = await getVoteTally(gameId, "initial voting");
    res.json({ tally: result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// Determine finalists (top 3 or fewer)
export async function determineFinalistsController(req: Request, res: Response) {
  try {
    const gameId = parseInt(req.params.gameId);
    const finalists = await determineFinalists(gameId);
    res.json({ finalists });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function castInitialVotesController(req: Request, res: Response) {
  try {
    const gameId = parseInt(req.params.gameId);
    const { voterId, targets } = req.body;

    const result = await castInitialVotes(gameId, voterId, targets);

    // Auto-advance after initial voting if all votes are cast
    await autoAdvancePhase(gameId);

    res.json({ message: "Initial votes recorded", result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// Cast single final vote
export async function castFinalVoteController(req: Request, res: Response) {
  try {
    const gameId = parseInt(req.params.gameId);
    const { voterId, targetId } = req.body;

    const result = await castFinalVote(gameId, voterId, targetId);

    // Auto-advance after final voting
    await autoAdvancePhase(gameId);

    res.json({ message: "Final vote recorded", result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// Get tally for final voting
export async function finalTallyController(req: Request, res: Response) {
  try {
    const gameId = parseInt(req.params.gameId);
    const { votes, majority } = await tallyFinalVotes(gameId);

    res.json({ votes, majority });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// Resolve tie manually (choose eliminated finalist)
export async function resolveFinalTieController(req: Request, res: Response) {
  try {
    const { finalistId } = req.body;
    const result = await eliminateFinalist(finalistId);

    res.json({ message: "Tie resolved, finalist eliminated", result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}
