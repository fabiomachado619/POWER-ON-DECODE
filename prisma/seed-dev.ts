import { PrismaClient } from "@prisma/client";
import { runSeed } from "../scripts/seed-core";

const prisma = new PrismaClient();

runSeed(prisma, "dev")
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
