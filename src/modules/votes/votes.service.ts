import prisma from "../../config/db";

// Cast initial votes (multi-vote)
export async function castInitialVotes(gameId: number, voterId: number, targets: number[]) {
  // Remove existing votes from this voter in initial voting
  await prisma.vote.deleteMany({
    where: { game_id: gameId, phase: "initial voting", voter_id: voterId }
  });

  // Insert multiple votes
  const votes = targets.map(target => ({
    game_id: gameId,
    phase: "initial voting",
    voter_id: voterId,
    target_id: target
  }));

  return prisma.vote.createMany({ data: votes });
}

// Cast single final vote
export async function castFinalVote(gameId: number, voterId: number, targetId: number) {
  await prisma.vote.deleteMany({
    where: { game_id: gameId, phase: "final voting", voter_id: voterId }
  });

  return prisma.vote.create({
    data: {
      game_id: gameId,
      voter_id: voterId,
      target_id: targetId,
      phase: "final voting"
    }
  });
}

// Get tally (initial or final)
export async function getVoteTally(gameId: number, phase: string) {
  const votes = await prisma.vote.findMany({
    where: { game_id: gameId, phase }
  });

  // Count votes by target_id
  const tally: Record<number, number> = {};
  for (const v of votes) {
    if (v.target_id !== null) {
      tally[v.target_id] = (tally[v.target_id] || 0) + 1;
    }
  }

  // Sort: votes DESC, seat ASC
  const gamePlayers = await prisma.gamePlayer.findMany({ where: { game_id: gameId } });

  const results = Object.entries(tally)
    .map(([targetId, count]) => {
      const gp = gamePlayers.find(p => p.id === parseInt(targetId));
      return { targetId: parseInt(targetId), votes: count, seat: gp?.seat ?? 999 };
    })
    .sort((a, b) => b.votes - a.votes || a.seat - b.seat);

  return results;
}

// Determine finalists (top 3 with ≥ half threshold)
export async function determineFinalists(gameId: number) {
  const tally = await getVoteTally(gameId, "initial voting");

  const aliveCount = await prisma.gamePlayer.count({
    where: { game_id: gameId, alive: true }
  });

  const halfThreshold = Math.ceil(aliveCount / 3);
  const eligible = tally.filter(t => t.votes >= halfThreshold);

  // Top 3 finalists
  const finalists = eligible.slice(0, 3);

  return finalists;
}

// Tally final votes
export async function tallyFinalVotes(gameId: number) {
  const votes = await prisma.vote.groupBy({
    by: ["target_id"],
    where: { game_id: gameId, phase: "final voting" },
    _count: { target_id: true }
  });

  const totalAlive = await prisma.gamePlayer.count({
    where: { game_id: gameId, alive: true }
  });

  const majority = Math.ceil(totalAlive / 3);

  return { votes, majority };
}

// Eliminate finalist
export async function eliminateFinalist(finalistId: number) {
  return prisma.gamePlayer.update({
    where: { id: finalistId },
    data: { alive: false, removedAt: "Final vote", cause: "Eliminated in final voting" }
  });
}
