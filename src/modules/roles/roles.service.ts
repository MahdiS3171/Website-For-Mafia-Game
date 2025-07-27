import prisma from "../../config/db";

// Create new role
export async function createRole(name: string, tag: string, description?: string) {
  return prisma.role.create({
    data: { name, tag, description },
  });
}

// Get all roles
export async function getAllRoles() {
  return prisma.role.findMany();
}

// Get roles for a specific game (roles assigned to players in that game)
export async function getRolesInGame(gameId: number) {
  return prisma.role.findMany({
    where: {
      gamePlayers: {
        some: {
          game_id: gameId,
        },
      },
    },
  });
}

// Update role
export async function updateRole(id: number, name?: string, tag?: string, description?: string) {
  return prisma.role.update({
    where: { role_id: id },
    data: { name, tag, description },
  });
}

// Delete role
export async function deleteRole(id: number) {
  return prisma.role.delete({
    where: { role_id: id },
  });
}

