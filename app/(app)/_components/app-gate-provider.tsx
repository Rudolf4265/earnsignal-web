"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { ApiError, isApiError } from "@/src/lib/api/client";
import { fetchEntitlements, type EntitlementsResponse } from "@/src/lib/api/entitlements";
import { checkIsAdmin } from "@/src/lib/admin/access";
import { createClient } from "@/src/lib/supabase/client";
import { getSession, onAuthStateChange } from "@/src/lib/supabase/session";
import { deriveAppGateState, isAppGateLoading, type AppGateState, type EntitlementsResolution } from "@/src/lib/gating/app-gate";

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
  requestId?: string;
  error: string | null;
  actions: GateActions;
};

const AppGateContext = createContext<AppGateContextValue | null>(null);

function isSessionExpiredApiError(error: unknown): error is ApiError {
  return isApiError(error) && error.status === 401 && error.code === "SESSION_EXPIRED";
}

export function AppGateProvider({ children }: { children: React.ReactNode }) {
  const [isSessionKnown, setIsSessionKnown] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [entitlementsState, setEntitlementsState] = useState<EntitlementsResolution>({ status: "idle" });
  const [error, setError] = useState<string | null>(null);

  const loadEntitlements = useCallback(async (options?: { forceRefresh?: boolean }) => {
    setEntitlementsState({ status: "loading" });

    try {
      const nextEntitlements = await fetchEntitlements(options);
      setEntitlementsState({ status: nextEntitlements.entitled ? "entitled" : "unentitled", entitlements: nextEntitlements });
      setError(null);
      return nextEntitlements;
    } catch (err) {
      if (isSessionExpiredApiError(err)) {
        setEntitlementsState({ status: "session_expired", requestId: err.requestId });
        setError(err.message);
      } else {
        const message = err instanceof Error ? err.message : "Unable to load access status.";
        setEntitlementsState({ status: "error" });
        setError(message);
      }

      return null;
    }
  }, []);

  const syncSessionState = useCallback((nextSession: Session | null) => {
    if (!nextSession) {
      setIsAdmin(false);
      setEntitlementsState({ status: "idle" });
      setError(null);
      return;
    }

    void checkIsAdmin().then((allowed) => {
      setIsAdmin(allowed);
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

  const state = deriveAppGateState({ isSessionKnown, session, entitlements: entitlementsState, isAdmin });

  const actions = useMemo<GateActions>(
    () => ({
      signIn: (returnTo = "/app") => {
        if (typeof window !== "undefined") {
          const encoded = encodeURIComponent(returnTo);
          window.location.assign(`/login?returnTo=${encoded}`);
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
      isAdmin,
      requestId: entitlementsState.status === "session_expired" ? entitlementsState.requestId : undefined,
      error,
      actions,
    }),
    [actions, entitlementsState, error, isAdmin, session, state],
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
