"use client";

import { useMemo } from "react";
import { useAppGate } from "./app-gate-provider";
import {
  canDownloadPdfFromEntitlement,
  canGenerateReportFromEntitlement,
  hasProEquivalentEntitlement,
  resolveAccessGranted,
  resolveAccessReasonCode,
  resolveBillingRequired,
  resolveEffectivePlanTier,
  resolveEntitlementSource,
} from "@/src/lib/entitlements/model";

export type EntitlementStateSnapshot = {
  loading: boolean;
  error: boolean;
  requestId?: string;
  effectivePlanTier: string;
  entitlementSource: string | null;
  accessGranted: boolean;
  accessReasonCode: string | null;
  billingRequired: boolean;
  canGenerateReport: boolean;
  canDownloadPdf: boolean;
  hasProAccess: boolean;
  refresh: () => Promise<void>;
};

export function useEntitlementState(): EntitlementStateSnapshot {
  const gate = useAppGate();
  const snapshot = gate.entitlements;

  return useMemo(
    () => ({
      loading: gate.state === "session_loading" || gate.state === "authed_loading_entitlements",
      error: gate.state === "entitlements_error",
      requestId: gate.errorRequestId,
      effectivePlanTier: resolveEffectivePlanTier(snapshot),
      entitlementSource: resolveEntitlementSource(snapshot),
      accessGranted: resolveAccessGranted(snapshot),
      accessReasonCode: resolveAccessReasonCode(snapshot),
      billingRequired: resolveBillingRequired(snapshot),
      canGenerateReport: canGenerateReportFromEntitlement(snapshot),
      canDownloadPdf: canDownloadPdfFromEntitlement(snapshot),
      hasProAccess: hasProEquivalentEntitlement(snapshot),
      refresh: async () => {
        await gate.actions.refreshEntitlements({ forceRefresh: true });
      },
    }),
    [gate.actions, gate.errorRequestId, gate.state, snapshot],
  );
}
