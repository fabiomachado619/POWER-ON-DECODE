import { PrismaClient } from "@prisma/client";
import { seedProductMappings } from "./seed-product-mappings";

const prisma = new PrismaClient();

async function main() {
  console.log("Sincronizando mapeamentos de produto...");
  await seedProductMappings(prisma);
  console.log("Seed de mapeamentos concluído.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
