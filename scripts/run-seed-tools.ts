import { PrismaClient } from "@prisma/client";
import { seedToolsMetadata } from "./seed-tools";

const prisma = new PrismaClient();
const mode =
  process.env.SEED_MODE === "production" ? "production" : ("dev" as const);

async function main() {
  console.log(`Sincronizando metadados das ferramentas (${mode})...`);
  await seedToolsMetadata(prisma, mode);
  console.log("Seed de ferramentas concluído.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
