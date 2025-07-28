import prisma from "../../config/db";

import { determineFinalists, tallyFinalVotes, eliminateFinalist } from "../votes/votes.service";
import { startDefense } from "../defense/defense.service";

// Create a new game
export async function createGame() {
  return prisma.game.create({
    data: {},
  });
}

// Add players to a game
export async function addPlayersToGame(
  gameId: number,
  playersData: { player_id: number; role_id: number; seat: number; side: string }[]
) {
  const gamePlayers = await prisma.gamePlayer.createMany({
    data: playersData.map((player) => ({
      game_id: gameId,
      player_id: player.player_id,
      role_id: player.role_id,
      seat: player.seat,
      side: player.side, // FIX: Ensure side is provided
    })),
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
          role: true,
        },
      },
    },
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
  // Mark player as removed
  const updatedPlayer = await prisma.gamePlayer.update({
    where: { id: gamePlayerId },
    data: { alive: false, removedAt },
  });

  // Automatically regenerate seats after elimination
  await autoRegenerateSeats(updatedPlayer.game_id);

  return updatedPlayer;
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
    include: { game: true },
  });

  if (!gamePlayer) throw new Error("GamePlayer not found");

  const { currentDay, currentPhase } = gamePlayer.game;
  const removedAt = `Day ${currentDay} - ${currentPhase}`;

  const updated = await prisma.gamePlayer.update({
    where: { id: gamePlayerId },
    data: { alive: false, removedAt, cause },
  });

  await autoRegenerateSeats(gamePlayer.game_id);

  return updated;
}

export async function endGameAndSetWinners(gameId: number, winningSide: string) {
  // Fetch all game players
  const players = await prisma.gamePlayer.findMany({
    where: { game_id: gameId },
  });

  // Update winners/losers based on side
  const updates = players.map((player) =>
    prisma.gamePlayer.update({
      where: { id: player.id },
      data: { won: player.side === winningSide },
    })
  );

  await prisma.$transaction(updates);

  return { message: "Game ended and winners set" };
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
        where: { game_id: gameId, alive: false, removedAt: null },
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

export async function generateSeats(gameId: number, startingPlayerId: number) {
  const game = await prisma.game.findUnique({
    where: { game_id: gameId },
    include: {
      gamePlayers: {
        where: { alive: true },
        orderBy: { seat: "asc" }
      }
    }
  });

  if (!game) throw new Error("Game not found");

  const alivePlayers = game.gamePlayers;
  const startIndex = alivePlayers.findIndex(p => p.id === startingPlayerId);

  // Reorder so starting player is first
  const reordered = [
    ...alivePlayers.slice(startIndex),
    ...alivePlayers.slice(0, startIndex)
  ];

  const assignments = reordered.map((player, index) => ({
    game_id: gameId,
    gamePlayer_id: player.id,
    day: game.currentDay,
    phase: game.currentPhase,
    seatNumber: index + 1
  }));

  await prisma.seatAssignment.createMany({ data: assignments });

  return assignments;
}



export async function autoRegenerateSeats(gameId: number) {
  const game = await prisma.game.findUnique({
    where: { game_id: gameId },
    include: {
      gamePlayers: {
        where: { alive: true },
        orderBy: { seat: "asc" }
      }
    }
  });

  if (!game) throw new Error("Game not found");

  // Sequential seats for alive players
  const alivePlayers = game.gamePlayers;
  const assignments = alivePlayers.map((player, index) => ({
    game_id: gameId,
    gamePlayer_id: player.id,
    day: game.currentDay,
    phase: game.currentPhase,
    seatNumber: index + 1
  }));

  // Save to SeatAssignment table
  await prisma.seatAssignment.createMany({ data: assignments });

  return assignments;
}


export async function finalizeWillPhase(gameId: number) {
  // Mark all dead players without a removal record
  const deadPlayers = await prisma.gamePlayer.findMany({
    where: { game_id: gameId, alive: false, removedAt: null },
    include: { game: true }
  });

  if (deadPlayers.length > 0) {
    const updates = deadPlayers.map((player) =>
      prisma.gamePlayer.update({
        where: { id: player.id },
        data: { removedAt: `Day ${player.game.currentDay} - will phase` }
      })
    );

    await prisma.$transaction(updates);
  }

  // After Will phase, move to Night phase
  return prisma.game.update({
    where: { game_id: gameId },
    data: { currentPhase: "night" }
  });
}


export async function autoAdvancePhase(gameId: number) {
  const game = await prisma.game.findUnique({ where: { game_id: gameId } });
  if (!game) throw new Error("Game not found");

  let nextPhase = game.currentPhase;

  switch (game.currentPhase) {
    case "day":
      // After day → move to initial voting
      nextPhase = "voting";
      break;

    case "voting":
      // Determine finalists based on votes
      const finalists = await determineFinalists(gameId);

      if (finalists.length === 0) {
        // No finalists → skip defense/deny/defend → go straight to night
        nextPhase = "night";
      } else {
        // Move to defense and store finalists
        nextPhase = "defense";
        await startDefense(gameId, finalists.map(f => f.targetId));
      }
      break;

    case "defense":
      // After defense speeches → deny role phase
      nextPhase = "deny";
      break;

    case "deny":
      // After deny role actions → assign defend players
      nextPhase = "defend";
      break;

    case "defend":
      // After defend phase → final voting
      nextPhase = "final voting";
      break;

    case "final voting":
      // Count votes and check majority
      const { votes, majority } = await tallyFinalVotes(gameId);

      const topVote = votes.reduce((max, v) =>
        v._count.target_id > max._count.target_id ? v : max,
        votes[0]
      );

      if (topVote && topVote._count.target_id >= majority) {
        // Eliminate finalist with majority
        await eliminateFinalist(topVote.target_id!);
        nextPhase = "will";
      } else {
        // No majority → go directly to night
        nextPhase = "night";
      }
      break;

    case "will":
      // After will phase → night
      nextPhase = "night";
      break;

    case "night":
      // After night → next day
      nextPhase = "day";
      break;

    default:
      // Fallback to day if phase is unknown
      nextPhase = "day";
  }

  // Update game phase and increment day if returning to "day"
  return prisma.game.update({
    where: { game_id: gameId },
    data: {
      currentPhase: nextPhase,
      ...(nextPhase === "day" ? { currentDay: game.currentDay + 1 } : {})
    }
  });
}

