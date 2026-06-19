import dns from "dns/promises";

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

export function getPublicBaseUrl(): string {
  const base =
    process.env.WEBHOOK_PUBLIC_BASE_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    "http://localhost:3000";

  return normalizeBaseUrl(base);
}

export async function isHostnameResolvable(hostname: string): Promise<boolean> {
  if (!hostname || hostname === "localhost" || hostname === "127.0.0.1") {
    return true;
  }

  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) {
    return true;
  }

  try {
    await dns.lookup(hostname);
    return true;
  } catch {
    return false;
  }
}

export async function diagnosePublicBaseUrl(baseUrl = getPublicBaseUrl()) {
  try {
    const parsed = new URL(baseUrl);
    const dnsResolvable = await isHostnameResolvable(parsed.hostname);

    return {
      baseUrl,
      hostname: parsed.hostname,
      dnsResolvable,
      warning: dnsResolvable
        ? null
        : `O domínio ${parsed.hostname} não resolve no DNS. Configure o registro A/CNAME na VPS antes de usar este link em plataformas externas.`,
    };
  } catch {
    return {
      baseUrl,
      hostname: null,
      dnsResolvable: false,
      warning:
        "APP_URL ou WEBHOOK_PUBLIC_BASE_URL inválida. Exemplo: https://decode.seudominio.com.br",
    };
  }
}
