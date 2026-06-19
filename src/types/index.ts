export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "admin" | "customer";
}

export interface ModuleInfo {
  id: string;
  slug: string;
  name: string;
  description: string;
  active: boolean;
  hasAccess: boolean;
  accessStatus?: string;
}

export type ToolType =
  | "decode"
  | "reset"
  | "odometro"
  | "checksum"
  | "calculator"
  | "file_bank"
  | "curso";

export interface ToolCategoryInfo {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string | null;
  displayOrder: number;
}

export interface CategoryWithStats extends ToolCategoryInfo {
  unlockedCount: number;
  shopCount: number;
  totalCount: number;
}

export interface ManufacturerInfo {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

export interface ToolCatalogItem {
  id: string;
  slug: string;
  name: string;
  displayName: string;
  description: string;
  longDescription: string | null;
  coverImageUrl: string | null;
  type: ToolType;
  typeLabel: string;
  ecuName: string | null;
  eepromType: string | null;
  purchaseUrl: string | null;
  toolRoute: string | null;
  buttonText: string;
  featured: boolean;
  visible: boolean;
  showInStore: boolean;
  displayOrder: number;
  isImplemented: boolean;
  registryImplemented: boolean;
  registryMissing: boolean;
  hasAccess: boolean;
  isExpired: boolean;
  expiresAt: string | null;
  category: ToolCategoryInfo;
  manufacturer: ManufacturerInfo;
  module: {
    id: string;
    slug: string;
    name: string;
  };
}

export interface PublicStoreCatalog {
  featured: ToolCatalogItem[];
  byCategory: Record<string, ToolCatalogItem[]>;
  categories: ToolCategoryInfo[];
  totalCount: number;
}

export interface ToolsCatalog {
  categories: CategoryWithStats[];
  unlockedByCategory: Record<string, ToolCatalogItem[]>;
  shopItems: ToolCatalogItem[];
  allTools: ToolCatalogItem[];
  unlockedCount: number;
}

export interface CatalogCategoryGroup {
  category: ToolCategoryInfo;
  manufacturers: Array<{
    manufacturer: ManufacturerInfo;
    tools: ToolCatalogItem[];
  }>;
}

export interface DecodeProcedureInfo {
  id: string;
  slug: string;
  name: string;
  ecuName: string;
  eepromType: string;
  expectedSize: number;
  offsetHex: string;
}

export interface DecodeLogEntry {
  id: string;
  originalFilename: string;
  fileSize: number;
  offsetApplied: string;
  status: string;
  errorMessage: string | null;
  createdAt: string;
  procedureName: string;
  moduleName: string;
}

export interface PaymentWebhookPayload {
  provider: string;
  externalEventId: string;
  externalProductId: string;
  customerEmail: string;
  status: string;
  rawPayload: Record<string, unknown>;
}

export interface DecodeProgressStep {
  label: string;
  durationMs: number;
}

export interface ApiErrorResponse {
  error: string;
  details?: string[];
}

export interface LoginResponse {
  user: SessionUser;
}

export interface DashboardData {
  unlockedModules: ModuleInfo[];
  lockedModules: ModuleInfo[];
  recentLogs: DecodeLogEntry[];
}
