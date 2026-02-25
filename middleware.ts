import { NextRequest, NextResponse } from "next/server";

const MARKETING_PATHS = new Set(["/", "/pricing", "/example", "/privacy", "/terms"]);
const APP_ALLOWED_PREFIXES = ["/login", "/signup", "/app"];
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

// Canonical hosts (EarnSigma)
const MARKETING_HOST = "www.earnsigma.com";
const MARKETING_ROOT_HOST = "earnsigma.com";
const APP_HOST = "app.earnsigma.com";

const ALLOWED_HOSTS = new Set([
  MARKETING_HOST,
  MARKETING_ROOT_HOST,
  APP_HOST,
  "localhost",
  "app.localhost",
  "127.0.0.1",
]);

const ALLOWED_HOST_SUFFIXES = [".vercel.app", ".earnsigma.com", ".localhost"];

function getRequestHost(request: NextRequest): string {
  const raw = request.headers.get("host") ?? "";
  return raw.split(":")[0]?.trim().toLowerCase();
}

function isAllowedHost(host: string): boolean {
  return (
    ALLOWED_HOSTS.has(host) ||
    ALLOWED_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))
  );
}

function isStaticPath(pathname: string): boolean {
  return (
    STATIC_PATHS.has(pathname) ||
    STATIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    STATIC_EXTENSION_REGEX.test(pathname)
  );
}

function isMarketingPath(pathname: string): boolean {
  return MARKETING_PATHS.has(pathname);
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

function redirectToHostRoot(request: NextRequest, host: string): NextResponse {
  const url = request.nextUrl.clone();
  url.host = host;
  url.protocol = host.includes("localhost") ? "http:" : "https:";
  url.pathname = "/";
  url.search = "";
  url.hash = "";
  return NextResponse.redirect(url, 308);
}

export function middleware(request: NextRequest): NextResponse {
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

  // App host: allow only app/login/signup. Otherwise send to marketing root.
  if (isAppHost) {
    if (!isAppPath(pathname)) {
      return redirectToHostRoot(request, MARKETING_HOST);
    }
    return NextResponse.next();
  }

  // Marketing host: if someone hits an app path, push them to app host.
  if (isMarketingHost) {
    if (isAppPath(pathname)) {
      return redirectToHost(request, APP_HOST);
    }

    // Optional: if you only want a fixed marketing surface, force canonical paths.
    // If not desired, remove this block and allow Next to 404 naturally.
    if (!isMarketingPath(pathname)) {
      return redirectToHostRoot(request, MARKETING_HOST);
    }

    return NextResponse.next();
  }

  // With ALLOWED_HOSTS, we should never get here.
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|apple-touch-icon.png|og.png|brand/|fonts/|.*\\.(?:svg|png|ico|jpg|jpeg|webp|css|js|map|txt)$).*)",
  ],
};
