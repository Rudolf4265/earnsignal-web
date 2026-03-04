"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { fetchEntitlements, type EntitlementsResponse } from "@/src/lib/api/entitlements";
import { checkIsAdmin } from "@/src/lib/admin/access";
import { createClient } from "@/src/lib/supabase/client";
import { getSession, onAuthStateChange } from "@/src/lib/supabase/session";
import {
  buildLoginHref,
  deriveAppGateState,
  isAppGateLoading,
  type AppGateState,
  resolveEntitlementsError,
  type EntitlementsResolution,
} from "@/src/lib/gating/app-gate";

type GateActions = {
  signIn: (returnTo?: string) => void;
  signOut: () => Promise<void>;
  refreshEntitlements: (options?: { forceRefresh?: boolean }) => Promise<EntitlementsResponse | null>;
};

type AppGateContextValue = {
  state: AppGateState;
  isLoading: boolean;
  session: Session | null;
  entitlements: EntitlementsResponse | null;
  isAdmin: boolean;
  adminStatus: "unknown" | "admin" | "not_admin";
  requestId?: string;
  error: string | null;
  errorRequestId?: string;
  actions: GateActions;
};

const AppGateContext = createContext<AppGateContextValue | null>(null);

const DEBUG_AUDIT_FRONTEND = process.env.NEXT_PUBLIC_DEBUG_AUDIT_FRONTEND === "1" || process.env.NODE_ENV !== "production";

function debugGate(message: string, details: Record<string, unknown>) {
  if (!DEBUG_AUDIT_FRONTEND) {
    return;
  }

  console.debug(`[audit:gate] ${message}`, details);
}

export function AppGateProvider({ children }: { children: React.ReactNode }) {
  const adminCheckRef = useRef(0);
  const [isSessionKnown, setIsSessionKnown] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [adminStatus, setAdminStatus] = useState<"unknown" | "admin" | "not_admin">("unknown");
  const [entitlementsState, setEntitlementsState] = useState<EntitlementsResolution>({ status: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [errorRequestId, setErrorRequestId] = useState<string | undefined>(undefined);

  const loadEntitlements = useCallback(async (options?: { forceRefresh?: boolean }) => {
    setEntitlementsState({ status: "loading" });

    try {
      const nextEntitlements = await fetchEntitlements(options);
      setEntitlementsState({ status: nextEntitlements.entitled ? "entitled" : "unentitled", entitlements: nextEntitlements });
      debugGate("entitlements-evaluated", {
        plan: nextEntitlements.plan,
        status: nextEntitlements.status,
        entitled: nextEntitlements.entitled,
        featureFlags: Object.keys(nextEntitlements.features ?? {}),
      });
      setError(null);
      setErrorRequestId(undefined);
      return nextEntitlements;
    } catch (err) {
      const resolved = resolveEntitlementsError(err);
      setEntitlementsState(resolved);
      debugGate("entitlements-error", {
        resolution: resolved.status,
        message: err instanceof Error ? err.message : "unknown",
      });

      const message = err instanceof Error ? err.message : "Unable to load access status.";
      setError(message);
      setErrorRequestId(err instanceof Error && "requestId" in err && typeof (err as { requestId?: unknown }).requestId === "string" ? (err as { requestId: string }).requestId : undefined);

      return null;
    }
  }, []);

  const syncSessionState = useCallback((nextSession: Session | null) => {
    if (!nextSession) {
      adminCheckRef.current += 1;
      setAdminStatus("unknown");
      setEntitlementsState({ status: "idle" });
      setError(null);
      setErrorRequestId(undefined);
      return;
    }

    const checkId = adminCheckRef.current + 1;
    adminCheckRef.current = checkId;
    setAdminStatus("unknown");

    void checkIsAdmin()
      .then((allowed) => {
        if (adminCheckRef.current !== checkId) {
          return;
        }
        setAdminStatus(allowed ? "admin" : "not_admin");
      })
      .catch(() => {
        if (adminCheckRef.current !== checkId) {
          return;
        }
        setAdminStatus("not_admin");
      });

    void loadEntitlements();
  }, [loadEntitlements]);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | null = null;

    const boot = async () => {
      unsubscribe = await onAuthStateChange((_event, nextSession) => {
        if (!isMounted) {
          return;
        }

        setSession(nextSession);
        setIsSessionKnown(true);

        syncSessionState(nextSession);
      });

      const { data } = await getSession();

      if (!isMounted) {
        return;
      }

      const resolvedSession = data.session ?? null;
      setSession(resolvedSession);
      setIsSessionKnown(true);
      syncSessionState(resolvedSession);
    };

    void boot();

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, [syncSessionState]);

  const state = deriveAppGateState({ isSessionKnown, session, entitlements: entitlementsState, isAdmin: adminStatus === "admin" });

  const actions = useMemo<GateActions>(
    () => ({
      signIn: (returnTo = "/app") => {
        if (typeof window !== "undefined") {
          window.location.assign(buildLoginHref(returnTo));
        }
      },
      signOut: async () => {
        const supabase = await createClient();
        await supabase.auth.signOut();
      },
      refreshEntitlements: loadEntitlements,
    }),
    [loadEntitlements],
  );

  const value = useMemo<AppGateContextValue>(
    () => ({
      state,
      isLoading: isAppGateLoading(state),
      session,
      entitlements:
        entitlementsState.status === "entitled" || entitlementsState.status === "unentitled"
          ? entitlementsState.entitlements
          : null,
      isAdmin: adminStatus === "admin",
      adminStatus: !isSessionKnown || !session ? "unknown" : adminStatus,
      requestId: entitlementsState.status === "session_expired" ? entitlementsState.requestId : undefined,
      error,
      errorRequestId,
      actions,
    }),
    [actions, adminStatus, entitlementsState, error, errorRequestId, isSessionKnown, session, state],
  );

  return <AppGateContext.Provider value={value}>{children}</AppGateContext.Provider>;
}

export function useAppGate() {
  const context = useContext(AppGateContext);
  if (!context) {
    throw new Error("useAppGate must be used inside AppGateProvider");
  }

  return context;
}
