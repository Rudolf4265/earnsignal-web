import type { Session } from "@supabase/supabase-js";
import type { EntitlementsResponse } from "@/src/lib/api/entitlements";

export type AppGateState =
  | "session_loading"
  | "anon"
  | "authed_loading_entitlements"
  | "authed_entitled"
  | "authed_unentitled"
  | "session_expired"
  | "authed_admin";

export type EntitlementsResolution =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "entitled"; entitlements: EntitlementsResponse }
  | { status: "unentitled"; entitlements: EntitlementsResponse }
  | { status: "session_expired"; requestId?: string }
  | { status: "error" };

export function resolveEntitlementsError(error: unknown): EntitlementsResolution {
  if (typeof error === "object" && error !== null) {
    const candidate = error as { status?: unknown; requestId?: unknown };
    if (candidate.status === 401) {
      return {
        status: "session_expired",
        requestId: typeof candidate.requestId === "string" ? candidate.requestId : undefined,
      };
    }
  }

  return { status: "error" };
}

export function deriveAppGateState(params: {
  isSessionKnown: boolean;
  session: Session | null;
  entitlements: EntitlementsResolution;
  isAdmin: boolean;
}): AppGateState {
  const { isSessionKnown, session, entitlements, isAdmin } = params;

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

  if (entitlements.status === "unentitled") {
    return "authed_unentitled";
  }

  if (isAdmin) {
    return "authed_admin";
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
