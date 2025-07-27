import prisma from "../../config/db";

/**
 * Start defense phase by saving finalists
 */
export async function startDefense(gameId: number, finalistIds: number[]) {
  // Clear previous defense records for this game (if any)
  await prisma.defense.deleteMany({ where: { game_id: gameId } });

  // Insert finalists
  const defenseRecords = await prisma.defense.createMany({
    data: finalistIds.map(fid => ({
      game_id: gameId,
      finalist_id: fid
    }))
  });

  // Set phase to defense
  await prisma.game.update({
    where: { game_id: gameId },
    data: { currentPhase: "defense" }
  });

  return defenseRecords;
}

/**
 * Get finalists in defense order (seat order)
 */
export async function getDefenseOrder(gameId: number) {
  return prisma.defense.findMany({
    where: { game_id: gameId },
    include: {
      finalist: {
        include: { player: true }
      }
    },
    orderBy: {
      finalist: {
        seat: "asc"
      }
    }
  });
}

/**
 * Assign a defend player to a finalist
 */
export async function assignDefend(finalistId: number, defendId: number | null) {
  return prisma.defense.updateMany({
    where: { finalist_id: finalistId },
    data: { defend_id: defendId }
  });
}

/**
 * Get defend order (based on finalist seat order)
 */
export async function getDefendOrder(gameId: number) {
  return prisma.defense.findMany({
    where: { game_id: gameId },
    include: {
      finalist: {
        include: { player: true }
      },
      defend: {
        include: { player: true }
      }
    },
    orderBy: {
      finalist: {
        seat: "asc"
      }
    }
  });
}
