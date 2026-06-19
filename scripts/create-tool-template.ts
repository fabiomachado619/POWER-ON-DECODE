import fs from "fs";
import path from "path";

type CreateToolArgs = {
  slug: string;
  name: string;
  category: string;
  manufacturer: string;
  type: string;
  moduleSlug?: string;
};

function parseArgs(): CreateToolArgs {
  const slug = process.argv[2];
  if (!slug) {
    console.error("Uso: npm run create:tool -- <slug> [--name=] [--category=] [--manufacturer=] [--type=]");
    process.exit(1);
  }

  const options: Record<string, string> = {};
  for (const arg of process.argv.slice(3)) {
    const [key, value] = arg.replace(/^--/, "").split("=");
    if (key && value) options[key] = value;
  }

  return {
    slug,
    name: options.name ?? slug,
    category: options.category ?? "decode",
    manufacturer: options.manufacturer ?? "generic",
    type: options.type ?? options.category ?? "decode",
    moduleSlug: options.module ?? options.manufacturer ?? "generic",
  };
}

function renderTemplate(
  template: string,
  values: Record<string, string>
): string {
  return Object.entries(values).reduce(
    (content, [key, value]) => content.replaceAll(`__${key.toUpperCase()}__`, value),
    template
  );
}

function toCamelCase(value: string): string {
  return value
    .split("-")
    .map((part, index) =>
      index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join("");
}

function toPascalCase(value: string): string {
  const camel = toCamelCase(value);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

async function main() {
  const args = parseArgs();
  const targetDir = path.join(process.cwd(), "src", "tools", args.slug);
  const templateDir = path.join(process.cwd(), "src", "tools", "_template");

  if (fs.existsSync(targetDir)) {
    console.error(`A pasta ${targetDir} já existe.`);
    process.exit(1);
  }

  const replacements = {
    slug: args.slug,
    name: args.name,
    category: args.category,
    manufacturer: args.manufacturer,
    type: args.type,
    moduleSlug: args.moduleSlug ?? args.manufacturer,
    camelName: toCamelCase(args.slug),
    pascalName: toPascalCase(args.slug),
  };

  fs.mkdirSync(targetDir, { recursive: true });

  const files = fs
    .readdirSync(templateDir)
    .filter((file) => file.includes(".example."));

  for (const file of files) {
    const template = fs.readFileSync(path.join(templateDir, file), "utf8");
    const outputName = file.replace(".example", "");
    fs.writeFileSync(
      path.join(targetDir, outputName),
      renderTemplate(template, replacements),
      "utf8"
    );
  }

  console.log(`Ferramenta criada em src/tools/${args.slug}`);
  console.log("Próximos passos:");
  console.log(`1. Implementar validator/processor em src/tools/${args.slug}`);
  console.log("2. Registrar em src/tools/registry.ts");
  console.log("3. Na UI, usar getToolRunnerViewModel() — nunca passar RegisteredTool ao client");
  console.log("4. npm run seed:tools");
  console.log("5. npm run test:tools");
  console.log("6. npm run validate:production");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
