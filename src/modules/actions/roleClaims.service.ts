import prisma from "../../config/db";

// Player claims a role
export async function claimRole(gameId: number, gamePlayerId: number, roleId: number, phase: string) {
  return prisma.roleClaim.create({
    data: {
      game_id: gameId,
      gamePlayer_id: gamePlayerId,
      role_id: roleId,
      phase,
      isDeny: false
    }
  });
}

// Player denies a role claim
export async function denyRole(gameId: number, gamePlayerId: number, roleId: number, phase: string) {
  return prisma.roleClaim.create({
    data: {
      game_id: gameId,
      gamePlayer_id: gamePlayerId,
      role_id: roleId,
      phase,
      isDeny: true
    }
  });
}

// Player shows ability (reveals what they did at night)
export async function showAbility(roleClaimId: number, description: string) {
  return prisma.roleClaim.update({
    where: { id: roleClaimId },
    data: { showText: description }
  });
}

// Get claims for a specific phase/game
export async function getClaimsByPhase(gameId: number, phase: string) {
  return prisma.roleClaim.findMany({
    where: { game_id: gameId, phase },
    include: { gamePlayer: true, role: true }
  });
}
