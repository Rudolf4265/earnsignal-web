"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppGate } from "./app-gate-provider";
import { EntitlementsErrorCallout, GateLoadingShell, NotEntitledCallout, SessionExpiredCallout } from "./gate-callouts";
import { decideFeatureGuardOutcome } from "@/src/lib/gating/feature-guard-decision.mjs";

type GuardedFeature = "upload" | "report";

export function FeatureGuard({ feature, children }: { feature: GuardedFeature; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const replacedRef = useRef(false);
  const { state, actions, requestId } = useAppGate();

  const outcome = decideFeatureGuardOutcome({ gateState: state, pathname, feature });

  useEffect(() => {
    if (outcome.kind === "redirect" && !replacedRef.current) {
      replacedRef.current = true;
      router.replace(outcome.href);
      return;
    }

    replacedRef.current = false;
  }, [outcome, router]);

  switch (outcome.kind) {
    case "render_children":
      return <>{children}</>;
    case "render_loading":
      return (
        <div data-testid="gate-loading">
          <GateLoadingShell />
        </div>
      );
    case "render_session_expired":
      return <SessionExpiredCallout requestId={requestId} />;
    case "render_entitlements_error":
      return <EntitlementsErrorCallout onRetry={() => void actions.refreshEntitlements({ forceRefresh: true })} />;
    case "render_not_entitled":
      return <NotEntitledCallout />;
    case "redirect":
      return <NotEntitledCallout />;
    default:
      return <NotEntitledCallout />;
  }
}
