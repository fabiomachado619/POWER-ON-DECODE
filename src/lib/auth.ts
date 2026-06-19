import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { createSessionToken, verifySessionToken } from "@/lib/session";
import type { SessionUser } from "@/types";

const SESSION_COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME ?? "podt_session";
const SESSION_MAX_AGE = Number(process.env.SESSION_MAX_AGE ?? 604800);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getSessionFromRequest(
  request: NextRequest
): Promise<SessionUser | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export { createSessionToken, verifySessionToken, SESSION_COOKIE_NAME };
