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

  // Update game phase to "defense"
  await prisma.game.update({
    where: { game_id: gameId },
    data: { currentPhase: "defense" }
  });

  return defenseRecords;
}

/**
 * Get finalists in defense order (ordered by seat)
 */
export async function getDefenseOrder(gameId: number) {
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

/**
 * Assign a defend player to a finalist
 * If defendId is null, it means the finalist skipped defend choice
 */
export async function assignDefend(finalistId: number, defendId: number | null) {
  const defense = await prisma.defense.findFirst({
    where: { finalist_id: finalistId }
  });

  if (!defense) {
    throw new Error("Defense record not found for this finalist");
  }

  return prisma.defense.update({
    where: { id: defense.id },
    data: { defend_id: defendId }
  });
}

/**
 * Get full defense stage data (finalists + their chosen defend, if any)
 */
export async function getDefenseStage(gameId: number) {
  return prisma.defense.findMany({
    where: { game_id: gameId },
    include: {
      finalist: { include: { player: true } },
      defend: { include: { player: true } }
    }
  });
}
