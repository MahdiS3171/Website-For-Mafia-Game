import { Request, Response } from "express";
import { castInitialVotes, castFinalVote, getVoteTally, determineFinalists } from "./votes.service";

export async function castInitialVotesController(req: Request, res: Response) {
  try {
    const gameId = parseInt(req.params.id);
    const { voterId, targets } = req.body;
    const result = await castInitialVotes(gameId, voterId, targets);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

export async function castFinalVoteController(req: Request, res: Response) {
  try {
    const gameId = parseInt(req.params.id);
    const { voterId, target } = req.body;
    const result = await castFinalVote(gameId, voterId, target);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

export async function getVoteTallyController(req: Request, res: Response) {
  try {
    const gameId = parseInt(req.params.id);
    const { round } = req.query as { round: string };
    const tally = await getVoteTally(gameId, round);
    res.json(tally);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

export async function determineFinalistsController(req: Request, res: Response) {
  try {
    const gameId = parseInt(req.params.id);
    const finalists = await determineFinalists(gameId);
    res.json(finalists);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
}

