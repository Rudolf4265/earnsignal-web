"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { EntitlementsResponse, fetchEntitlements } from "@/src/lib/api/entitlements";

type EntitlementsContextValue = {
  entitlements: EntitlementsResponse | null;
  isLoading: boolean;
  error: string | null;
  refresh: (options?: { forceRefresh?: boolean }) => Promise<EntitlementsResponse | null>;
};

const EntitlementsContext = createContext<EntitlementsContextValue | null>(null);

export function EntitlementsProvider({ children }: { children: React.ReactNode }) {
  const [entitlements, setEntitlements] = useState<EntitlementsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (options?: { forceRefresh?: boolean }) => {
    setIsLoading(true);

    try {
      const nextEntitlements = await fetchEntitlements(options);
      setEntitlements(nextEntitlements);
      setError(null);
      return nextEntitlements;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load billing status";
      setError(message);
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
      refresh,
    }),
    [entitlements, error, isLoading, refresh],
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
