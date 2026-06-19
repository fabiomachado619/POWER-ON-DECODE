import {
  findOrCreateUserByEmail,
  grantModuleAccess,
} from "../src/lib/accessControl";
import { DEFAULT_USER_PASSWORD } from "../src/lib/constants";
import { prisma } from "../src/lib/prisma";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const SLUG = "ssangyong-rexton-25c320-decode";
const TEST_EMAIL = `webhook-test-${Date.now()}@example.com`;

async function login(email: string, password: string) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(`Login falhou: ${res.status} ${await res.text()}`);
  }
  const cookie = res.headers.get("set-cookie")?.split(";")[0];
  if (!cookie) throw new Error("Cookie de sessão ausente");
  return cookie;
}

async function fetchToolPage(cookie: string) {
  const res = await fetch(`${BASE}/tools/${SLUG}`, {
    headers: { Cookie: cookie },
    redirect: "manual",
  });
  const html = await res.text();
  return { status: res.status, html, location: res.headers.get("location") };
}

async function main() {
  const user = await findOrCreateUserByEmail({
    email: TEST_EMAIL,
    name: "Cliente Webhook Teste",
    password: DEFAULT_USER_PASSWORD,
  });

  await grantModuleAccess({
    userId: user.id,
    moduleSlug: "ssangyong",
    source: "webhook:test",
    sendEmail: false,
  });

  const cookie = await login(TEST_EMAIL, DEFAULT_USER_PASSWORD);
  const page = await fetchToolPage(cookie);

  console.log("Usuário webhook simulado:", TEST_EMAIL);
  console.log("Status:", page.status);
  console.log("Redirect:", page.location ?? "(none)");

  const failures: string[] = [];
  if (page.html.includes("Application error: a server-side exception")) {
    failures.push("página de erro 500 do Next.js");
  }
  if (page.html.includes("Functions cannot be passed directly to Client Components")) {
    failures.push("funções enviadas ao Client Component");
  }
  if (page.status !== 200) {
    failures.push(`status HTTP ${page.status}`);
  }
  if (!page.html.includes("Aplicar Decode")) {
    failures.push("formulário da ferramenta não renderizado");
  }

  if (failures.length > 0) {
    console.error("FALHA:", failures.join("; "));
    process.exit(1);
  }

  console.log("OK: usuário via webhook abre a ferramenta sem erro.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
