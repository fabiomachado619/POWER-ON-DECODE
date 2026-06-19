export const DEFAULT_USER_PASSWORD = "123456";
export const DEFAULT_ACCESS_DAYS = 365;
export const PASSWORD_RESET_EXPIRY_HOURS = 1;

export const ACCESS_STATUSES = [
  "active",
  "blocked",
  "expired",
  "refunded",
  "canceled",
] as const;

export type AccessStatus = (typeof ACCESS_STATUSES)[number];

export const USER_ROLES = ["super_admin", "admin", "customer"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export { SUPER_ADMIN_EMAIL } from "@/lib/roles";
export const NOTIFICATION_TYPES = [
  "expires_30d",
  "expires_7d",
  "expires_1d",
  "expired",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const EMAIL_TEMPLATE_SLUGS = {
  WELCOME: "welcome_access",
  PASSWORD_RESET: "password_reset",
  EXPIRES_30D: "expires_30d",
  EXPIRES_7D: "expires_7d",
  EXPIRES_1D: "expires_1d",
  EXPIRED: "expired",
  RENEWAL_DISCOUNT: "renewal_discount",
  ACCESS_GRANTED_NEW_USER: "access_granted_new_user",
  ACCESS_GRANTED_EXISTING_USER: "access_granted_existing_user",
} as const;

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function isAccessExpired(expiresAt: Date | null | undefined): boolean {
  if (!expiresAt) return false;
  return expiresAt.getTime() < Date.now();
}

export function resolveRenewalExpiresAt(
  currentExpiresAt: Date | null | undefined,
  days = DEFAULT_ACCESS_DAYS
): Date {
  const now = new Date();
  const base =
    currentExpiresAt && currentExpiresAt.getTime() > now.getTime()
      ? currentExpiresAt
      : now;
  return addDays(base, days);
}
