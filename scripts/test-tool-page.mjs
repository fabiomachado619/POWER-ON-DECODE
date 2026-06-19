/** Teste rápido: login + GET /tools/ssangyong-rexton-25c320-decode */
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const EMAIL = process.env.TEST_EMAIL ?? "eletricapoweron@gmail.com";
const PASSWORD = process.env.TEST_PASSWORD ?? "Saga@2011";
const SLUG = "ssangyong-rexton-25c320-decode";

async function main() {
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });

  const loginBody = await loginRes.text();
  if (!loginRes.ok) {
    console.error("Login falhou:", loginRes.status, loginBody);
    process.exit(1);
  }

  const setCookie = loginRes.headers.get("set-cookie") ?? "";
  const sessionCookie = setCookie.split(";")[0];
  if (!sessionCookie) {
    console.error("Sem cookie de sessão:", setCookie);
    process.exit(1);
  }

  const pageRes = await fetch(`${BASE}/tools/${SLUG}`, {
    headers: { Cookie: sessionCookie },
    redirect: "manual",
  });

  const html = await pageRes.text();
  console.log("Status:", pageRes.status);
  console.log("Location:", pageRes.headers.get("location") ?? "(none)");

  if (html.includes("Application error: a server-side exception")) {
    console.error("FALHA: página de erro do Next.js");
    process.exit(1);
  }

  if (html.includes("Functions cannot be passed directly to Client Components")) {
    console.error("FALHA: funções passadas ao Client Component");
    process.exit(1);
  }

  if (pageRes.status === 200 && html.includes("Aplicar Decode")) {
    console.log("OK: ferramenta carregou (formulário presente)");
    process.exit(0);
  }

  if (pageRes.status === 307 || pageRes.status === 302) {
    console.log("Redirect para:", pageRes.headers.get("location"));
    process.exit(pageRes.status === 302 ? 0 : 1);
  }

  console.log("Resposta inesperada (primeiros 500 chars):");
  console.log(html.slice(0, 500));
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
