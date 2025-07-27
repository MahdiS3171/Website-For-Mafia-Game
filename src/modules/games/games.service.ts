import prisma from "../../config/db";

// Create a new game
export async function createGame() {
  return prisma.game.create({
    data: {},
  });
}

// Add players to a game
export async function addPlayersToGame(gameId: number, playersData: { player_id: number, role_id: number, seat: number }[]) {
  const gamePlayers = await prisma.gamePlayer.createMany({
    data: playersData.map(player => ({
      game_id: gameId,
      player_id: player.player_id,
      role_id: player.role_id,
      seat: player.seat,
    }))
  });

  return gamePlayers;
}

// Get game with players
export async function getGameDetails(gameId: number) {
  return prisma.game.findUnique({
    where: { game_id: gameId },
    include: {
      gamePlayers: {
        include: {
          player: true,
          role: true
        }
      }
    }
  });
}

export async function updatePlayerStatus(gamePlayerId: number, alive: boolean) {
  return prisma.gamePlayer.update({
    where: { id: gamePlayerId },
    data: { alive },
  });
}

export async function assignRoleToPlayer(gamePlayerId: number, roleId: number) {
  return prisma.gamePlayer.update({
    where: { id: gamePlayerId },
    data: { role_id: roleId },
  });
}

export async function updateRemovalInfo(gamePlayerId: number, removedAt: string) {
  return prisma.gamePlayer.update({
    where: { id: gamePlayerId },
    data: { alive: false, removedAt },
  });
}

export async function updateWinStatus(gamePlayerId: number, won: boolean) {
  return prisma.gamePlayer.update({
    where: { id: gamePlayerId },
    data: { won },
  });
}

export async function autoRemovePlayer(gamePlayerId: number, cause: string) {
  // Get game info for phase/day
  const gamePlayer = await prisma.gamePlayer.findUnique({
    where: { id: gamePlayerId },
    include: { game: true }
  });

  if (!gamePlayer) throw new Error("GamePlayer not found");

  const { currentDay, currentPhase } = gamePlayer.game;
  const removedAt = `Day ${currentDay} - ${currentPhase}`;

  return prisma.gamePlayer.update({
    where: { id: gamePlayerId },
    data: { alive: false, removedAt, cause }
  });
}

export async function endGameAndSetWinners(gameId: number, winningSide: string) {
  // winningSide is "citizen" or "mafia"
  return prisma.gamePlayer.updateMany({
    where: { game_id: gameId },
    data: {
      won: prisma.raw(`CASE WHEN side = '${winningSide}' THEN true ELSE false END`)
    }
  });
}

export async function advancePhase(gameId: number) {
  const game = await prisma.game.findUnique({ where: { game_id: gameId } });
  if (!game) throw new Error("Game not found");

  let nextPhase = "";
  let nextDay = game.currentDay;

  switch (game.currentPhase) {
    case "day":
      nextPhase = "voting";
      break;

    case "voting":
      nextPhase = "night";
      break;

    case "night":
      // Check if any dead players without will logged
      const pendingWill = await prisma.gamePlayer.findMany({
        where: { game_id: gameId, alive: false, removedAt: null }
      });

      if (pendingWill.length > 0) {
        nextPhase = "will";
      } else {
        nextPhase = "day";
        nextDay += 1;
      }
      break;

    case "will":
      nextPhase = "day";
      nextDay += 1;
      break;

    default:
      nextPhase = "day";
  }

  return prisma.game.update({
    where: { game_id: gameId },
    data: {
      currentPhase: nextPhase,
      currentDay: nextDay,
    },
  });
}
