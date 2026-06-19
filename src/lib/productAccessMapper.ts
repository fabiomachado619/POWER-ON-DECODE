/**
 * Mapeia external_product_id (plataforma de pagamento) para slug do módulo interno.
 *
 * Configure via PAYMENT_PRODUCT_MAP no .env:
 * prod_ssangyong:ssangyong,prod_volkswagen:volkswagen
 */
const DEFAULT_PRODUCT_MAP: Record<string, string> = {
  prod_ssangyong: "ssangyong",
  prod_volkswagen: "volkswagen",
  prod_fiat: "fiat",
  "prod_jeep-fiat-scanner": "jeep-fiat-scanner",
};

function loadProductMapFromEnv(): Record<string, string> {
  const raw = process.env.PAYMENT_PRODUCT_MAP;
  if (!raw) return DEFAULT_PRODUCT_MAP;

  const map: Record<string, string> = { ...DEFAULT_PRODUCT_MAP };

  for (const pair of raw.split(",")) {
    const [productId, moduleSlug] = pair.split(":").map((part) => part.trim());
    if (productId && moduleSlug) {
      map[productId] = moduleSlug;
    }
  }

  return map;
}

let cachedMap: Record<string, string> | null = null;

function getProductMap(): Record<string, string> {
  if (!cachedMap) {
    cachedMap = loadProductMapFromEnv();
  }
  return cachedMap;
}

export function resolveModuleSlugFromProductId(
  externalProductId: string
): string | null {
  if (!externalProductId) return null;
  const map = getProductMap();
  return map[externalProductId] ?? null;
}

export function listProductMappings(): Array<{
  externalProductId: string;
  moduleSlug: string;
}> {
  return Object.entries(getProductMap()).map(
    ([externalProductId, moduleSlug]) => ({
      externalProductId,
      moduleSlug,
    })
  );
}

export function registerProductMapping(
  externalProductId: string,
  moduleSlug: string
): void {
  const map = getProductMap();
  map[externalProductId] = moduleSlug;
}
