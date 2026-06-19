import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const lockfilePath = path.join(ROOT, "package-lock.json");
const packagePath = path.join(ROOT, "package.json");

function main() {
  if (!fs.existsSync(packagePath)) {
    console.error("package.json não encontrado.");
    process.exit(1);
  }

  if (!fs.existsSync(lockfilePath)) {
    console.error("package-lock.json ausente. Execute npm install e commite o lockfile.");
    process.exit(1);
  }

  const before = fs.readFileSync(lockfilePath, "utf8");

  execSync("npm install --package-lock-only --ignore-scripts", {
    cwd: ROOT,
    stdio: "pipe",
  });

  const after = fs.readFileSync(lockfilePath, "utf8");

  if (before !== after) {
    console.error(
      "package-lock.json está dessincronizado com package.json. Rode npm install e commite o lockfile."
    );
    process.exit(1);
  }

  execSync("npm ci --ignore-scripts --dry-run", {
    cwd: ROOT,
    stdio: "inherit",
  });

  console.log("Lockfile sincronizado: npm ci pode rodar no Docker sem npm install manual.");
}

main();
