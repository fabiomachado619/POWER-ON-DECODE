import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@/lib/roles";
import type { SessionUser } from "@/types";

const SESSION_COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME ?? "podt_session";
const SESSION_MAX_AGE = Number(process.env.SESSION_MAX_AGE ?? 604800);

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET não configurado.");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getJwtSecret());
}

export async function verifySessionToken(
  token: string
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (
      typeof payload.id !== "string" ||
      typeof payload.name !== "string" ||
      typeof payload.email !== "string"
    ) {
      return null;
    }
    const role: UserRole =
      payload.role === "super_admin" ||
      payload.role === "admin" ||
      payload.role === "customer"
        ? payload.role
        : "customer";
    return {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      role,
    };
  } catch {
    return null;
  }
}

export { SESSION_COOKIE_NAME };
