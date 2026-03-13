import type { EntitlementsResponse } from "../api/entitlements";
import type { AppGateState } from "../gating/app-gate";
import { canDownloadPdfFromEntitlement, hasProEquivalentEntitlement } from "../entitlements/model.ts";

export type ReportDetailProSectionMode = "pro-unlocked" | "pro-locked" | "loading-safe";
export type ReportDetailPdfAccessMode = "pdf-unlocked" | "pdf-locked" | "loading-safe";

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

  return hasProEquivalentEntitlement(entitlements) ? "pro-unlocked" : "pro-locked";
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

function resolvePdfAccessMode(gateState: AppGateState, entitlements: EntitlementsResponse | null): ReportDetailPdfAccessMode {
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

  return canDownloadPdfFromEntitlement(entitlements) ? "pdf-unlocked" : "pdf-locked";
}

export function resolveReportDetailPdfAccessMode(input: BuildReportDetailSectionGatingInput): ReportDetailPdfAccessMode {
  return resolvePdfAccessMode(input.gateState, input.entitlements);
}

export function canAccessFullReportPdf(mode: ReportDetailPdfAccessMode): boolean {
  return mode === "pdf-unlocked";
}
