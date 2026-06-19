import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");

const CLIENT_MARKERS = ['"use client"', "'use client'"];

const forbiddenClientImports = [
  "@/tools/registry",
  "tools/registry",
];

const forbiddenClientPatterns = [
  /\bRegisteredTool\b/,
  /\bgetRegisteredTool\s*\(/,
  /\blistRegisteredTools\s*\(/,
  /\blistImplementedTools\s*\(/,
];

const forbiddenUiPatterns = [
  /<ToolRunnerPage\s+tool=/,
  /\btool=\{[^}]*Tool\b/,
];

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      walk(fullPath, files);
    } else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function isClientFile(content: string): boolean {
  const head = content.slice(0, 300);
  return CLIENT_MARKERS.some((marker) => head.includes(marker));
}

function relative(file: string): string {
  return path.relative(ROOT, file);
}

function validateClientComponents(files: string[]): string[] {
  const errors: string[] = [];

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    if (!isClientFile(content)) continue;

    for (const imp of forbiddenClientImports) {
      if (content.includes(imp)) {
        errors.push(
          `${relative(file)}: Client Component não pode importar "${imp}". Use apenas ToolRunnerViewModel/config serializável.`
        );
      }
    }

    for (const pattern of forbiddenClientPatterns) {
      if (pattern.test(content)) {
        errors.push(
          `${relative(file)}: Client Component referencia registry/RegisteredTool (${pattern}).`
        );
      }
    }
  }

  return errors;
}

function validateUiPatterns(files: string[]): string[] {
  const errors: string[] = [];

  for (const file of files) {
    if (!file.endsWith(".tsx")) continue;
    const content = fs.readFileSync(file, "utf8");

    for (const pattern of forbiddenUiPatterns) {
      if (pattern.test(content)) {
        errors.push(
          `${relative(file)}: padrão proibido (${pattern}). Passe apenas config/viewModel serializável para ToolRunnerPage.`
        );
      }
    }
  }

  return errors;
}

function main() {
  const files = walk(SRC);
  const errors = [
    ...validateClientComponents(files),
    ...validateUiPatterns(files),
  ];

  if (errors.length > 0) {
    console.error("Falha na validação de arquitetura de ferramentas:\n");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log(
    "Arquitetura de ferramentas OK: nenhum Client Component recebe registry com funções."
  );
}

main();
