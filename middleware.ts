import { NextRequest, NextResponse } from "next/server";

const MARKETING_PATHS = new Set(["/", "/pricing", "/example", "/privacy", "/terms"]);
const APP_ALLOWED_PREFIXES = ["/login", "/signup", "/app"];
const EXCLUDED_PREFIXES = ["/_next", "/images", "/fonts"];
const EXCLUDED_PATHS = new Set(["/favicon.ico", "/robots.txt", "/sitemap.xml"]);

const marketingHost = process.env.NEXT_PUBLIC_MARKETING_HOST?.trim() || "earnsignalstudio.com";
const appHost = process.env.NEXT_PUBLIC_APP_HOST?.trim() || "app.earnsignalstudio.com";
const marketingWwwHost = `www.${marketingHost}`;

function getRequestHost(request: NextRequest): string {
  return request.headers.get("host")?.split(":")[0] ?? "";
}

function isExcludedPath(pathname: string): boolean {
  return EXCLUDED_PATHS.has(pathname) || EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isMarketingPath(pathname: string): boolean {
  return MARKETING_PATHS.has(pathname);
}

function isAppPath(pathname: string): boolean {
  return APP_ALLOWED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function redirectToHost(request: NextRequest, host: string): NextResponse {
  const url = request.nextUrl.clone();
  url.host = host;
  url.protocol = host.includes("localhost") ? "http:" : "https:";
  return NextResponse.redirect(url);
}

function redirectToCanonicalMarketingHost(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone();
  url.host = marketingHost;
  url.protocol = marketingHost.includes("localhost") ? "http:" : "https:";
  return NextResponse.redirect(url, 308);
}

export function middleware(request: NextRequest): NextResponse {
  const pathname = request.nextUrl.pathname;

  if (isExcludedPath(pathname)) {
    return NextResponse.next();
  }

  const host = getRequestHost(request);
  if (host === marketingWwwHost) {
    return redirectToCanonicalMarketingHost(request);
  }

  const isAppHost = host === appHost || host === "app.localhost";
  const isMarketingHost = host === marketingHost || host === marketingWwwHost || host === "localhost";

  if (isAppHost) {
    if (!isAppPath(pathname)) {
      return redirectToHost(request, marketingHost);
    }

    return NextResponse.next();
  }

  if (isMarketingHost) {
    if (isAppPath(pathname)) {
      return redirectToHost(request, appHost);
    }

    return NextResponse.next();
  }

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
