import type { EntitlementsResponse } from "../api/entitlements";
import { isProPlan } from "../dashboard/action-cards";
import type { AppGateState } from "../gating/app-gate";
import { hasProEquivalentEntitlement } from "../entitlements/model";

export type ReportDetailProSectionMode = "pro-unlocked" | "pro-locked" | "loading-safe";
export type ReportDetailPdfAccessMode = ReportDetailProSectionMode;

export type ReportDetailSectionGatingModel = {
  subscriberHealth: ReportDetailProSectionMode;
  growthRecommendations: ReportDetailProSectionMode;
  revenueOutlook: ReportDetailProSectionMode;
  platformRiskExplanation: ReportDetailProSectionMode;
};

export type BuildReportDetailSectionGatingInput = {
  gateState: AppGateState;
  entitlements: EntitlementsResponse | null;
};

function resolveProSectionMode(gateState: AppGateState, entitlements: EntitlementsResponse | null): ReportDetailProSectionMode {
  if (
    gateState === "session_loading" ||
    gateState === "authed_loading_entitlements" ||
    gateState === "anon" ||
    gateState === "session_expired" ||
    gateState === "entitlements_error" ||
    entitlements === null
  ) {
    return "loading-safe";
  }

  return hasProEquivalentEntitlement(entitlements) || isProPlan(entitlements) ? "pro-unlocked" : "pro-locked";
}

export function buildReportDetailSectionGatingModel(input: BuildReportDetailSectionGatingInput): ReportDetailSectionGatingModel {
  const proMode = resolveProSectionMode(input.gateState, input.entitlements);
  return {
    subscriberHealth: proMode,
    growthRecommendations: proMode,
    revenueOutlook: proMode,
    platformRiskExplanation: proMode,
  };
}

export function canRenderReportDetailProContent(mode: ReportDetailProSectionMode): boolean {
  return mode === "pro-unlocked";
}

export function resolveReportDetailPdfAccessMode(input: BuildReportDetailSectionGatingInput): ReportDetailPdfAccessMode {
  return resolveProSectionMode(input.gateState, input.entitlements);
}

export function canAccessFullReportPdf(mode: ReportDetailPdfAccessMode): boolean {
  return mode === "pro-unlocked";
}
