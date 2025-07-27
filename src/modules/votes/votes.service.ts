import prisma from "../../config/db";

export async function castInitialVotes(gameId: number, voterId: number, targets: number[]) {
  // Remove existing votes from this voter in initial round
  await prisma.vote.deleteMany({
    where: { game_id: gameId, round: "initial", voter_id: voterId }
  });

  // Insert multiple votes
  const votes = targets.map(target => ({
    game_id: gameId,
    round: "initial",
    voter_id: voterId,
    target_id: target
  }));

  return prisma.vote.createMany({ data: votes });
}

export async function castFinalVote(gameId: number, voterId: number, targetId: number) {
  await prisma.vote.deleteMany({
    where: { game_id: gameId, round: "final", voter_id: voterId }
  });

  return prisma.vote.create({
    data: {
      game_id: gameId,
      round: "final",
      voter_id: voterId,
      target_id: targetId
    }
  });
}

export async function getVoteTally(gameId: number, round: string) {
  const votes = await prisma.vote.findMany({
    where: { game_id: gameId, round }
  });

  // Count votes by target_id
  const tally: Record<number, number> = {};
  for (const v of votes) {
    tally[v.target_id] = (tally[v.target_id] || 0) + 1;
  }

  // Sort by votes DESC, then seat ASC
  const gamePlayers = await prisma.gamePlayer.findMany({ where: { game_id: gameId } });

  const results = Object.entries(tally)
    .map(([targetId, count]) => {
      const gp = gamePlayers.find(p => p.id === parseInt(targetId));
      return { targetId: parseInt(targetId), votes: count, seat: gp?.seat ?? 999 };
    })
    .sort((a, b) => b.votes - a.votes || a.seat - b.seat);

  return results;
}

export async function determineFinalists(gameId: number) {
  const tally = await getVoteTally(gameId, "initial");

  const aliveCount = await prisma.gamePlayer.count({
    where: { game_id: gameId, alive: true }
  });

  const halfThreshold = Math.ceil(aliveCount / 2);
  const eligible = tally.filter(t => t.votes >= halfThreshold);

  // Top 3 finalists (tie-breaker by seat handled in sorting)
  const finalists = eligible.slice(0, 3);

  return finalists;
}
