import { NextRequest, NextResponse } from "next/server";
import { getCanonicalHosts, isAllowedHost } from "./src/lib/config/domains";

const APP_ALLOWED_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/auth/callback",
  "/app",
  "/debug",
];
const STATIC_PATH_PREFIXES = ["/_next/", "/brand/", "/fonts/"];
const STATIC_PATHS = new Set([
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
  "/apple-touch-icon.png",
  "/og.png",
]);
const STATIC_EXTENSION_REGEX = /\.(svg|png|ico|jpg|jpeg|webp|css|js|map|txt)$/i;

const { marketingHost: MARKETING_HOST, marketingRootHost: MARKETING_ROOT_HOST, appHost: APP_HOST } = getCanonicalHosts();

function getRequestHost(request: NextRequest): string {
  const raw = request.headers.get("host") ?? "";
  return raw.split(":")[0]?.trim().toLowerCase();
}

function isStaticPath(pathname: string): boolean {
  return (
    STATIC_PATHS.has(pathname) ||
    STATIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    STATIC_EXTENSION_REGEX.test(pathname)
  );
}

function isAppPath(pathname: string): boolean {
  return APP_ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function redirectToHost(request: NextRequest, host: string): NextResponse {
  const url = request.nextUrl.clone();
  url.host = host;
  url.protocol = host.includes("localhost") ? "http:" : "https:";
  return NextResponse.redirect(url, 308);
}

function redirectToPath(request: NextRequest, pathname: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  url.hash = "";
  return NextResponse.redirect(url, 308);
}

export function hasAppSessionCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"));
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (isStaticPath(pathname)) {
    return NextResponse.next();
  }

  const host = getRequestHost(request);

  // Allow known hosts plus deployment domains (e.g. Vercel preview URLs).
  if (!isAllowedHost(host)) {
    return NextResponse.next();
  }

  const isPreviewHost = host.endsWith(".vercel.app");
  const isAppHost = host === APP_HOST || host === "app.localhost";
  const isMarketingHost =
    host === MARKETING_HOST ||
    host === MARKETING_ROOT_HOST ||
    host === "localhost" ||
    host === "127.0.0.1" ||
    isPreviewHost;

  // Root → canonical www (keep path/query)
  if (host === MARKETING_ROOT_HOST) {
    return redirectToHost(request, MARKETING_HOST);
  }

  if (isAppHost) {
    if (pathname === "/") {
      return redirectToPath(request, hasAppSessionCookie(request) ? "/app" : "/login");
    }

    if (!isAppPath(pathname)) {
      return redirectToPath(request, hasAppSessionCookie(request) ? "/app" : "/login");
    }
    return NextResponse.next();
  }

  if (isMarketingHost) {
    return NextResponse.next();
  }

  // With ALLOWED_HOSTS, we should never get here.
  return NextResponse.next();
}

export const config = {
  // Keep all /api routes out of host-routing redirects.
  matcher: ["/((?!api|_next/|favicon.ico|.*\..*).*)"],
};
