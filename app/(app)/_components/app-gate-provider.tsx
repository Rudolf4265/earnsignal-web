"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { fetchEntitlements, type EntitlementsResponse } from "@/src/lib/api/entitlements";
import { checkIsAdmin } from "@/src/lib/admin/access";
import { createBrowserSupabaseClient } from "@/src/lib/supabase/client";
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

function hasResolvedEntitlements(state: EntitlementsResolution): state is Extract<EntitlementsResolution, { status: "entitled" | "unentitled" }> {
  return state.status === "entitled" || state.status === "unentitled";
}

export function AppGateProvider({ children }: { children: React.ReactNode }) {
  const adminCheckRef = useRef(0);
  const entitlementsRequestRef = useRef(0);
  const entitlementsInFlightRef = useRef<Promise<EntitlementsResponse | null> | null>(null);
  const [isSessionKnown, setIsSessionKnown] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [adminStatus, setAdminStatus] = useState<"unknown" | "admin" | "not_admin">("unknown");
  const [entitlementsState, setEntitlementsState] = useState<EntitlementsResolution>({ status: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [errorRequestId, setErrorRequestId] = useState<string | undefined>(undefined);

  const loadEntitlements = useCallback(async (options?: { forceRefresh?: boolean }) => {
    const forceRefresh = options?.forceRefresh ?? false;
    if (!forceRefresh && entitlementsInFlightRef.current) {
      return entitlementsInFlightRef.current;
    }

    setEntitlementsState((prev) => {
      if (hasResolvedEntitlements(prev) || prev.status === "loading") {
        return prev;
      }

      return { status: "loading" };
    });

    const requestId = entitlementsRequestRef.current + 1;
    entitlementsRequestRef.current = requestId;

    const request = (async () => {
      try {
        const nextEntitlements = await fetchEntitlements({ forceRefresh });
        if (requestId !== entitlementsRequestRef.current) {
          return nextEntitlements;
        }

        setEntitlementsState({ status: nextEntitlements.entitled ? "entitled" : "unentitled", entitlements: nextEntitlements });
        setError(null);
        setErrorRequestId(undefined);
        return nextEntitlements;
      } catch (err) {
        if (requestId !== entitlementsRequestRef.current) {
          return null;
        }

        const resolved = resolveEntitlementsError(err);
        setEntitlementsState((prev) => {
          if (resolved.status === "session_expired") {
            return resolved;
          }

          if (hasResolvedEntitlements(prev)) {
            return prev;
          }

          return resolved;
        });

        const message = err instanceof Error ? err.message : "Unable to load access status.";
        setError(message);
        setErrorRequestId(err instanceof Error && "requestId" in err && typeof (err as { requestId?: unknown }).requestId === "string" ? (err as { requestId: string }).requestId : undefined);
        return null;
      }
    })();

    entitlementsInFlightRef.current = request;

    try {
      return await request;
    } finally {
      if (entitlementsInFlightRef.current === request) {
        entitlementsInFlightRef.current = null;
      }
    }
  }, []);

  const syncSessionState = useCallback((nextSession: Session | null) => {
    if (!nextSession) {
      adminCheckRef.current += 1;
      entitlementsRequestRef.current += 1;
      entitlementsInFlightRef.current = null;
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
        const supabase = await createBrowserSupabaseClient();
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
