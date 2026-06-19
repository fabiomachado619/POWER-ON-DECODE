import { PrismaClient } from "@prisma/client";
import { runSeed } from "../scripts/seed-core";

const prisma = new PrismaClient();
const mode =
  process.env.SEED_MODE === "production" ? "production" : ("dev" as const);

runSeed(prisma, mode)
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
