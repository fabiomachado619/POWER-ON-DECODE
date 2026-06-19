export const USER_ROLES = ["super_admin", "admin", "customer"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const SUPER_ADMIN_EMAIL = "eletricapoweron@gmail.com";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isSuperAdminEmail(email: string): boolean {
  return normalizeEmail(email) === normalizeEmail(SUPER_ADMIN_EMAIL);
}

export function isSuperAdminRole(role: string): boolean {
  return role === "super_admin";
}

export function isAdminRole(role: string): boolean {
  return role === "admin";
}

export function isStaffRole(role: string): boolean {
  return role === "super_admin" || role === "admin";
}

export function canAccessAdminArea(role: string): boolean {
  return isStaffRole(role);
}

export function isProtectedSuperAdminUser(user: {
  email: string;
  role: string;
}): boolean {
  return isSuperAdminRole(user.role) || isSuperAdminEmail(user.email);
}

export function getRoleLabel(role: string): string {
  switch (role) {
    case "super_admin":
      return "Super Admin";
    case "admin":
      return "Administrador";
    default:
      return "Cliente";
  }
}
