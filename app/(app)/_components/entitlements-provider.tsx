"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { EntitlementsResponse, fetchEntitlements } from "@/src/lib/api/entitlements";
import { isSessionExpiredError } from "@/src/lib/api/client";

type EntitlementsContextValue = {
  entitlements: EntitlementsResponse | null;
  isLoading: boolean;
  error: string | null;
  isSessionExpired: boolean;
  refresh: (options?: { forceRefresh?: boolean }) => Promise<EntitlementsResponse | null>;
};

const EntitlementsContext = createContext<EntitlementsContextValue | null>(null);

export function EntitlementsProvider({ children }: { children: React.ReactNode }) {
  const [entitlements, setEntitlements] = useState<EntitlementsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  const refresh = useCallback(async (options?: { forceRefresh?: boolean }) => {
    setIsLoading(true);

    try {
      const nextEntitlements = await fetchEntitlements(options);
      setEntitlements(nextEntitlements);
      setError(null);
      setIsSessionExpired(false);
      return nextEntitlements;
    } catch (err) {
      if (isSessionExpiredError(err)) {
        setError("Session expired. Please sign in again.");
        setIsSessionExpired(true);
      } else {
        const message = err instanceof Error ? err.message : "Unable to load billing status";
        setError(message);
        setIsSessionExpired(false);
      }

      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<EntitlementsContextValue>(
    () => ({
      entitlements,
      isLoading,
      error,
      isSessionExpired,
      refresh,
    }),
    [entitlements, error, isLoading, isSessionExpired, refresh],
  );

  return <EntitlementsContext.Provider value={value}>{children}</EntitlementsContext.Provider>;
}

export function useEntitlements() {
  const context = useContext(EntitlementsContext);

  if (!context) {
    throw new Error("useEntitlements must be used inside EntitlementsProvider");
  }

  return context;
}
