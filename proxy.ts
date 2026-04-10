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

const {
  marketingHost: MARKETING_HOST,
  marketingRootHost: MARKETING_ROOT_HOST,
  appHost: APP_HOST,
} = getCanonicalHosts();

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

function isLocalDevHost(host: string): boolean {
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "app.localhost" ||
    host.endsWith(".localhost")
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

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const host = getRequestHost(request);

  // Never interfere with static assets.
  if (isStaticPath(pathname)) {
    return NextResponse.next();
  }

  // Local development bypass:
  // allow localhost/127.0.0.1 traffic to stay on the current host
  // so auth and app navigation do not bounce to production.
  if (process.env.NODE_ENV !== "production" && isLocalDevHost(host)) {
    return NextResponse.next();
  }

  // Allow known hosts plus deployment domains (e.g. Vercel preview URLs).
  if (!isAllowedHost(host)) {
    return NextResponse.next();
  }

  const isPreviewHost = host.endsWith(".vercel.app");
  const isAppHost = host === APP_HOST;
  const isMarketingHost =
    host === MARKETING_HOST ||
    host === MARKETING_ROOT_HOST ||
    isPreviewHost;

  // Root -> canonical marketing host
  if (host === MARKETING_ROOT_HOST) {
    return redirectToHost(request, MARKETING_HOST);
  }

  // App host: allow auth utility routes and /app. Otherwise send to marketing root.
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
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  // Keep all /api routes out of host-routing redirects.
  matcher: ["/((?!api|_next/|favicon.ico|.*\\..*).*)"],
};