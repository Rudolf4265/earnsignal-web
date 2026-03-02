"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { canAccessPathWhenUnentitled } from "@/src/lib/gating/app-gate";
import { useAppGate } from "./app-gate-provider";
import { EntitlementsErrorCallout, GateLoadingShell, NotEntitledCallout, SessionExpiredCallout } from "./gate-callouts";

type GuardedFeature = "upload" | "report";

export function FeatureGuard({ feature, children }: { feature: GuardedFeature; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const replacedRef = useRef(false);
  const { state, entitlements, requestId, actions } = useAppGate();

  const hasFeature = Boolean(entitlements?.features?.[feature]);

  useEffect(() => {
    if (state === "authed_unentitled" && !canAccessPathWhenUnentitled(pathname) && !replacedRef.current) {
      replacedRef.current = true;
      router.replace(`/app/billing?feature=${feature}`);
      return;
    }

    replacedRef.current = false;
  }, [feature, pathname, router, state]);

  if (state === "session_loading" || state === "authed_loading_entitlements") {
    return (
      <div data-testid="gate-loading">
        <GateLoadingShell />
      </div>
    );
  }

  if (state === "session_expired") {
    return <SessionExpiredCallout requestId={requestId} />;
  }

  if (state === "entitlements_error") {
    return <EntitlementsErrorCallout onRetry={() => void actions.refreshEntitlements({ forceRefresh: true })} />;
  }

  if (state === "authed_unentitled") {
    if (!canAccessPathWhenUnentitled(pathname)) {
      return <NotEntitledCallout />;
    }

    if (!hasFeature) {
      return <NotEntitledCallout />;
    }
  }

  if (state !== "authed_entitled") {
    return (
      <div data-testid="gate-loading">
        <GateLoadingShell />
      </div>
    );
  }

  if (!hasFeature) {
    return <NotEntitledCallout />;
  }

  return <>{children}</>;
}
