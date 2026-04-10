import { NextRequest, NextResponse } from "next/server";
import {
  isDevBypassEnabled,
  shouldApplyDevBypass,
  buildSyntheticEntitlementEnvelope,
} from "@/src/lib/dev/entitlement-bypass";

/**
 * DEV-ONLY entitlement bypass route.
 *
 * Active only when DEV_ENTITLEMENT_BYPASS=true and NODE_ENV is not production.
 * Returns a synthetic Pro entitlement payload for allowlisted emails.
 * Proxies all other requests to the real upstream API.
 *
 * Never exposed in production — isDevBypassEnabled() returns false when
 * NODE_ENV=production, causing this route to 404 immediately.
 */

function extractEmailFromJwt(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const raw = Buffer.from(parts[1], "base64url").toString("utf-8");
    const payload = JSON.parse(raw) as Record<string, unknown>;
    const direct = payload.email;
    const fromMeta = (payload.user_metadata as Record<string, unknown> | undefined)?.email;
    const email = direct ?? fromMeta ?? null;
    return typeof email === "string" && email.trim() ? email.trim() : null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  if (!isDevBypassEnabled()) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const email = token ? extractEmailFromJwt(token) : null;

  if (shouldApplyDevBypass(email)) {
    const plan = (process.env.DEV_ENTITLEMENT_PLAN ?? "pro") as "pro";
    const payload = buildSyntheticEntitlementEnvelope(plan);

    console.warn(
      `[dev.entitlement-bypass] WARNING: DEV BYPASS ACTIVE — synthetic ${plan} entitlement` +
        ` returned for <${email ?? "unknown"}>. This must never run in production.`,
    );

    return NextResponse.json(payload);
  }

  // Email not in allowlist — proxy to the real upstream API so non-bypass
  // users retain normal behaviour when the bypass flag is set.
  const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");
  if (!apiBase) {
    return NextResponse.json(
      { error: "DEV bypass active but NEXT_PUBLIC_API_BASE_URL is not configured." },
      { status: 500 },
    );
  }

  const upstreamHeaders: Record<string, string> = { Accept: "application/json" };
  if (authHeader) upstreamHeaders.Authorization = authHeader;

  const upstream = await fetch(`${apiBase}/v1/entitlements`, { headers: upstreamHeaders });
  const body = await upstream.text();

  return new NextResponse(body, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" },
  });
}
