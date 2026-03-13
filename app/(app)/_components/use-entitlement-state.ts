"use client";

import { useMemo } from "react";
import { useAppGate } from "./app-gate-provider";
import {
  canAccessDashboardFromEntitlement,
  canDownloadPdfFromEntitlement,
  canGenerateReportFromEntitlement,
  canViewOwnedReportFromEntitlement,
  canViewReportHistoryFromEntitlement,
  hasProEquivalentEntitlement,
  resolveCapability,
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
  canUpload: boolean;
  canValidateUpload: boolean;
  canGenerateReport: boolean;
  canViewOwnedReport: boolean;
  canViewReportHistory: boolean;
  canDownloadPdf: boolean;
  canAccessDashboard: boolean;
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
      canUpload: resolveCapability(snapshot, "canUpload"),
      canValidateUpload: resolveCapability(snapshot, "canValidateUpload"),
      canGenerateReport: canGenerateReportFromEntitlement(snapshot),
      canViewOwnedReport: canViewOwnedReportFromEntitlement(snapshot),
      canViewReportHistory: canViewReportHistoryFromEntitlement(snapshot),
      canDownloadPdf: canDownloadPdfFromEntitlement(snapshot),
      canAccessDashboard: canAccessDashboardFromEntitlement(snapshot),
      hasProAccess: hasProEquivalentEntitlement(snapshot),
      refresh: async () => {
        await gate.actions.refreshEntitlements({ forceRefresh: true });
      },
    }),
    [gate.actions, gate.errorRequestId, gate.state, snapshot],
  );
}
