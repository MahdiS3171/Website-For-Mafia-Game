import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const actions = [
    // Day actions
    { name: "target", phase: "day", minTargets: 1, maxTargets: null },
    { name: "fling target", phase: "day", minTargets: 1, maxTargets: null },
    { name: "cover", phase: "day", minTargets: 1, maxTargets: null },
    { name: "one out of two target", phase: "day", minTargets: 2, maxTargets: 2 },
    { name: "one out of three target", phase: "day", minTargets: 3, maxTargets: 3 },
    { name: "two out of three target", phase: "day", minTargets: 3, maxTargets: 3 },
    {
      name: "role detection",
      phase: "day",
      minTargets: 1,
      maxTargets: 1,
      requiresRoleGuess: true // Role guess required
    },
    { name: "side with player", phase: "day", minTargets: 1, maxTargets: 1 },
    { name: "should vote for", phase: "day", minTargets: 1, maxTargets: null },

    // Like/Dislike (restricted in some phases)
    { name: "like", phase: "day", minTargets: 1, maxTargets: null },
    { name: "dislike", phase: "day", minTargets: 1, maxTargets: null },

    // Will phase actions
    { name: "will", phase: "will", minTargets: 1, maxTargets: null }
  ];

  for (const action of actions) {
    await prisma.actionType.upsert({
      where: { name: action.name },
      update: action,
      create: action,
    });
  }

  console.log("Global actions seeded successfully");
}

main()
  .catch((e) => {
    console.error("Error seeding actions:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
