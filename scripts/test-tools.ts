import { toolRegistry } from "../src/tools/registry";

async function main() {
  console.log(`Executando testes de ${toolRegistry.length} ferramenta(s)...`);
  let failed = 0;

  for (const tool of toolRegistry) {
    const label = tool.config.slug;
    process.stdout.write(`- ${label} ... `);

    if (!tool.runTests) {
      console.log("SKIP (sem testes)");
      continue;
    }

    try {
      await tool.runTests();
      console.log("OK");
    } catch (error) {
      failed += 1;
      console.log("FAIL");
      console.error(
        error instanceof Error ? error.message : "Erro desconhecido nos testes."
      );
    }
  }

  if (failed > 0) {
    console.error(`\n${failed} ferramenta(s) falharam nos testes.`);
    process.exit(1);
  }

  console.log("\nTodos os testes de ferramentas passaram.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
