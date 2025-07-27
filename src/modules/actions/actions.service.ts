import prisma from "../../config/db";

export async function logAction(
  gamePlayerId: number,
  actionTypeId: number,
  targets: number[],
  notes?: string
) {
  // Get current day & phase
  const gamePlayer = await prisma.gamePlayer.findUnique({
    where: { id: gamePlayerId },
    include: { game: true },
  });

  if (!gamePlayer) throw new Error("GamePlayer not found");

  return prisma.actionLog.create({
    data: {
      game_id: gamePlayer.game_id,
      gamePlayer_id: gamePlayerId,
      actionType_id: actionTypeId,
      day: gamePlayer.game.currentDay,
      phase: gamePlayer.game.currentPhase,
      targets: JSON.stringify(targets),
      notes,
    },
  });
}

// Create a role-specific or global action
export async function createActionType(name: string, phase: string, role_id?: number, description?: string) {
  return prisma.actionType.create({
    data: { name, phase, role_id, description },
  });
}

// Get all action types
export async function getActionTypes() {
  return prisma.actionType.findMany({
    include: { role: true }
  });
}

// Update an action type
export async function updateActionType(id: number, name?: string, phase?: string, role_id?: number, description?: string) {
  return prisma.actionType.update({
    where: { action_id: id },
    data: { name, phase, role_id, description },
  });
}

// Delete an action type
export async function deleteActionType(id: number) {
  return prisma.actionType.delete({
    where: { action_id: id },
  });
}

export async function getAvailableActionsForPlayer(gamePlayerId: number) {
  // Get the player's role + current phase from game
  const gamePlayer = await prisma.gamePlayer.findUnique({
    where: { id: gamePlayerId },
    include: { role: true, game: true },
  });

  if (!gamePlayer) throw new Error("GamePlayer not found");

  const currentPhase = gamePlayer.game.currentPhase;

  // Fetch actions that are either global or role-specific AND match phase
  return prisma.actionType.findMany({
    where: {
      AND: [
        { phase: currentPhase }, // only actions for current phase
        {
          OR: [
            { role_id: null },                // global actions
            { role_id: gamePlayer.role_id }   // role-specific actions
          ]
        }
      ]
    }
  });
}

export async function assignActionsToRole(roleId: number, actionIds: number[]) {
  // Update each action to belong to the role
  return prisma.$transaction(
    actionIds.map((id) =>
      prisma.actionType.update({
        where: { action_id: id },
        data: { role_id: roleId },
      })
    )
  );
}

