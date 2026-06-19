import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";
import { canAccessAdminArea } from "@/lib/roles";
const customerPages = ["/dashboard", "/modules", "/procedures", "/account", "/categories", "/shop", "/catalog", "/tools"];
const adminPages = ["/admin"];
const protectedApiPrefixes = [
  "/api/decode",
  "/api/tools",
  "/api/modules",
  "/api/history",
  "/api/account",
  "/api/admin",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  const isAdminPage = adminPages.some((prefix) => pathname.startsWith(prefix));
  const isAdminApi = pathname.startsWith("/api/admin");
  const isCustomerPage = customerPages.some((prefix) =>
    pathname.startsWith(prefix)
  );
  const isProtectedApi = protectedApiPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/reset-password");
  const isCron = pathname.startsWith("/api/cron");

  if (isCron) {
    return NextResponse.next();
  }

  if ((isAdminPage || isAdminApi) && (!session || !canAccessAdminArea(session.role))) {
    if (isAdminApi) {
      return NextResponse.json({ error: "Acesso administrativo negado." }, { status: 403 });
    }
    if (session) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if ((isCustomerPage || isProtectedApi) && !session) {
    if (isProtectedApi && !pathname.startsWith("/api/admin")) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    if (isCustomerPage) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (isAuthPage && session) {
    return NextResponse.redirect(
      new URL(canAccessAdminArea(session.role) ? "/admin" : "/dashboard", request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/modules/:path*",
    "/procedures/:path*",
    "/catalog/:path*",
    "/categories/:path*",
    "/shop/:path*",
    "/tools/:path*",
    "/account/:path*",
    "/admin/:path*",
    "/login",
    "/forgot-password",
    "/reset-password/:path*",
    "/api/decode/:path*",
    "/api/tools/:path*",
    "/api/modules/:path*",
    "/api/history/:path*",
    "/api/account/:path*",
    "/api/admin/:path*",
    "/api/cron/:path*",
  ],
};
