import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const BYPASS_PREFIXES = ["/_next", "/api", "/assets"];
const BYPASS_EXACT_PATHS = new Set(["/favicon.ico", "/robots.txt", "/sitemap.xml"]);
const PUBLIC_FILE_PATTERN = /\.[a-zA-Z0-9]+$/;

function hasSupabaseAuthCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"));
}

function isAdminSubdomain(hostHeader: string | null): boolean {
  if (!hostHeader) {
    return false;
  }

  const hostname = hostHeader.split(":")[0].toLowerCase();
  return hostname === "admin.localhost" || hostname.startsWith("admin.");
}

export function proxy(request: NextRequest) {
  const hostHeader = request.headers.get("host");
  const isAdmin = isAdminSubdomain(hostHeader);
  const { pathname } = request.nextUrl;
  const isPublicFile = PUBLIC_FILE_PATTERN.test(pathname);
  const hasAuthCookie = hasSupabaseAuthCookie(request);

  // Bloquear acceso directo a /admin desde dominio principal
  if (!isAdmin && (pathname.startsWith("/admin") || pathname.startsWith("/auth/admin"))) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Si NO es subdomain admin, dejar pasar normalmente
  if (!isAdmin) {
    return NextResponse.next();
  }

  // Si ES subdomain admin, permitir acceso normal
  if (
    pathname.startsWith("/auth/admin") ||
    pathname.startsWith("/favicon") ||
    isPublicFile ||
    BYPASS_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    BYPASS_EXACT_PATHS.has(pathname)
  ) {
    return NextResponse.next();
  }

  // Si entra al subdominio admin sin sesion, forzar login antes de cualquier rewrite.
  if (!hasAuthCookie) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/admin";
    loginUrl.searchParams.set("reason", "session");
    return NextResponse.redirect(loginUrl);
  }

  // Rutas /admin en subdominio admin pasan directamente.
  if (pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Reescribir rutas en el subdomain admin al /admin
  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? "/admin" : `/admin${pathname}`;

  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
