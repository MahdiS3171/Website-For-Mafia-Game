import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const roles = [
    { name: "doctor", tag: "citizen" },
    { name: "noface", tag: "citizen" },
    { name: "Boozer", tag: "citizen" },
    { name: "sniper", tag: "citizen" },
    { name: "gunsmith", tag: "citizen" },
    { name: "ordinary citizen", tag: "citizen" },
    { name: "godfather", tag: "mafia" },
    { name: "punisher", tag: "mafia" },
    { name: "attorney", tag: "mafia" },
    { name: "saboteur", tag: "mafia" },
    { name: "killer", tag: "mafia" },
    { name: "ordinary mafia", tag: "mafia" },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }
}

main()
  .then(() => {
    console.log("Roles seeded");
  })
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
