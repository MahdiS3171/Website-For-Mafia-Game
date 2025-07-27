import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const actions = [
    { name: "target", phase: "day" },
    { name: "fling target", phase: "day" },
    { name: "cover", phase: "day" },
    { name: "one out of two target", phase: "day" },
    { name: "one out of three target", phase: "day" },
    { name: "two out of three target", phase: "day" },
    { name: "role detection", phase: "day" },
    { name: "side with player", phase: "day" },
    { name: "should vote for", phase: "day" },
    { name: "like", phase: "day" },       // separated
    { name: "dislike", phase: "day" },    // separated
    { name: "will", phase: "will" }       // special phase
  ];

  for (const action of actions) {
    await prisma.actionType.upsert({
      where: { name: action.name },
      update: {},
      create: action,
    });
  }

  console.log("Global actions seeded");
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
