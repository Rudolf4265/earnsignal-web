import type { Session } from "@supabase/supabase-js";
import type { EntitlementsResponse } from "@/src/lib/api/entitlements";
import { isSessionExpiredError } from "../auth/isSessionExpiredError";

export type AppGateState =
  | "session_loading"
  | "anon"
  | "authed_loading_entitlements"
  | "authed_entitled"
  | "authed_unentitled"
  | "session_expired"
  | "entitlements_error";

export type EntitlementsResolution =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "entitled"; entitlements: EntitlementsResponse }
  | { status: "unentitled"; entitlements: EntitlementsResponse }
  | { status: "session_expired"; requestId?: string }
  | { status: "entitlements_error" };

export function resolveEntitlementsError(error: unknown): EntitlementsResolution {
  if (isSessionExpiredError(error, { hasAuthContext: true })) {
    const candidate = error as { status?: unknown; requestId?: unknown };
    return {
      status: "session_expired",
      requestId: typeof candidate.requestId === "string" ? candidate.requestId : undefined,
    };
  }

  return { status: "entitlements_error" };
}

export function deriveAppGateState(params: {
  isSessionKnown: boolean;
  session: Session | null;
  entitlements: EntitlementsResolution;
  isAdmin: boolean;
}): AppGateState {
  const { isSessionKnown, session, entitlements } = params;

  if (!isSessionKnown) {
    return "session_loading";
  }

  if (!session) {
    return "anon";
  }

  if (entitlements.status === "idle" || entitlements.status === "loading") {
    return "authed_loading_entitlements";
  }

  if (entitlements.status === "session_expired") {
    return "session_expired";
  }

  if (entitlements.status === "entitlements_error") {
    return "entitlements_error";
  }

  if (entitlements.status === "unentitled") {
    return "authed_unentitled";
  }

  return "authed_entitled";
}

export function canAccessPathWhenUnentitled(pathname: string): boolean {
  // Enterprise policy: /app/data remains available for ingestion workflows.
  // Report routes and premium analysis outputs stay gated to Billing.
  return pathname.startsWith("/app/billing") || pathname.startsWith("/app/settings") || pathname.startsWith("/app/data");
}

export function isAppGateLoading(state: AppGateState): boolean {
  return state === "session_loading" || state === "authed_loading_entitlements";
}

export function buildLoginHref(returnTo: string): string {
  return `/login?returnTo=${encodeURIComponent(returnTo)}`;
}
