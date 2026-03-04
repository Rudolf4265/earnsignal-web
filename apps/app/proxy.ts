import { NextRequest, NextResponse } from "next/server";

const primaryDomain = process.env.NEXT_PUBLIC_PRIMARY_DOMAIN ?? "earnsigma.com";
const appHost = `app.${primaryDomain}`;
const marketingOrigin = `https://${primaryDomain}`;

function getRequestHost(request: NextRequest): string {
  const raw = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  return raw.split(":")[0]?.trim().toLowerCase();
}

function isDevHost(host: string): boolean {
  return host === "localhost" || host === "127.0.0.1" || host.endsWith(".vercel.app");
}

function hasAppSessionCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some((cookie) => cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token"));
}

export function proxy(request: NextRequest): NextResponse {
  const host = getRequestHost(request);
  const { pathname, search } = request.nextUrl;

  if (pathname === "/") {
    const destination = hasAppSessionCookie(request) ? "/app" : "/login";
    return NextResponse.redirect(new URL(destination, request.url), 307);
  }

  if (process.env.NODE_ENV !== "production" && isDevHost(host)) {
    return NextResponse.next();
  }

  if (host && host !== appHost) {
    const redirectUrl = new URL(pathname + search, marketingOrigin);
    return NextResponse.redirect(redirectUrl, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
