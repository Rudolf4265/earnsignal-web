import { NextRequest, NextResponse } from "next/server";

const MARKETING_PATHS = new Set(["/", "/pricing", "/example", "/privacy", "/terms"]);
const APP_ALLOWED_PREFIXES = ["/login", "/signup", "/app"];
const EXCLUDED_PREFIXES = ["/_next", "/images", "/fonts"];
const EXCLUDED_PATHS = new Set(["/favicon.ico", "/robots.txt", "/sitemap.xml"]);

// ✅ Canonical Hosts (EarnSigma)
const marketingHost = "www.earnsigma.com"; // canonical marketing
const marketingRootHost = "earnsigma.com"; // root redirects to www
const appHost = "app.earnsigma.com";

function getRequestHost(request: NextRequest): string {
  return request.headers.get("host")?.split(":")[0] ?? "";
}

function isExcludedPath(pathname: string): boolean {
  return (
    EXCLUDED_PATHS.has(pathname) ||
    EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
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

export function middleware(request: NextRequest): NextResponse {
  const pathname = request.nextUrl.pathname;

  if (isExcludedPath(pathname)) {
    return NextResponse.next();
  }

  const host = getRequestHost(request);

  // ✅ Root → Canonical www
  if (host === marketingRootHost) {
    return redirectToHost(request, marketingHost);
  }

  const isAppHost = host === appHost || host === "app.localhost";
  const isMarketingHost =
    host === marketingHost ||
    host === marketingRootHost ||
    host === "localhost";

  // ✅ App host logic
  if (isAppHost) {
    if (!isAppPath(pathname)) {
      return redirectToHost(request, marketingHost);
    }
    return NextResponse.next();
  }

  // ✅ Marketing host logic
  if (isMarketingHost) {
    if (isAppPath(pathname)) {
      return redirectToHost(request, appHost);
    }
    return NextResponse.next();
  }

  // ✅ Fallbacks
  if (isMarketingPath(pathname)) {
    return redirectToHost(request, marketingHost);
  }

  if (isAppPath(pathname)) {
    return redirectToHost(request, appHost);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api).*)"],
};