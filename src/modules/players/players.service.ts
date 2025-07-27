import prisma from "../../config/db";

// Create a new player
export async function createPlayer(name: string) {
  // Check if player already exists
  const existingPlayer = await prisma.player.findUnique({
    where: { name },
  });

  if (existingPlayer) {
    return existingPlayer; // or throw an error if you prefer
  }

  // If not, create new player
  return prisma.player.create({
    data: { name },
  });
}


// Search players by name
export async function searchPlayers(query: string) {
  try {
    return await prisma.player.findMany({
      where: {
        name: {
          contains: query,
          mode: "insensitive",
        },
      },
    });
  } catch (error) {
    console.error("Error searching players:", error);
    throw error;
  }
}

// Get player with game history
export async function getPlayerById(playerId: number) {
  try {
    return await prisma.player.findUnique({
      where: { player_id: playerId },
      include: {
        gamePlayers: {
          include: {
            game: true,
            role: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching player:", error);
    throw error;
  }
}
