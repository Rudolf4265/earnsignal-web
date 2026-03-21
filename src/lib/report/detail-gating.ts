import type { EntitlementsResponse } from "../api/entitlements";
import type { AppGateState } from "../gating/app-gate";
import { canDownloadPdfFromEntitlement, canViewOwnedReportFromEntitlement, hasProEquivalentEntitlement } from "../entitlements/model";

export type ReportDetailProSectionMode = "pro-unlocked" | "pro-locked" | "loading-safe";
export type ReportDetailReportSectionMode = "report-unlocked" | "report-locked" | "loading-safe";
export type ReportDetailPdfAccessMode = "pdf-unlocked" | "pdf-locked" | "loading-safe";

export type ReportDetailSectionGatingModel = {
  subscriberHealth: ReportDetailProSectionMode;
  growthRecommendations: ReportDetailProSectionMode;
  revenueOutlook: ReportDetailProSectionMode;
  platformRiskExplanation: ReportDetailProSectionMode;
  wowSummary: ReportDetailReportSectionMode;
  opportunity: ReportDetailReportSectionMode;
  strengthsRisks: ReportDetailReportSectionMode;
  nextActions: ReportDetailReportSectionMode;
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

function resolveReportSectionMode(gateState: AppGateState, entitlements: EntitlementsResponse | null): ReportDetailReportSectionMode {
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

  return canViewOwnedReportFromEntitlement(entitlements) ? "report-unlocked" : "report-locked";
}

export function buildReportDetailSectionGatingModel(input: BuildReportDetailSectionGatingInput): ReportDetailSectionGatingModel {
  const proMode = resolveProSectionMode(input.gateState, input.entitlements);
  const reportMode = resolveReportSectionMode(input.gateState, input.entitlements);
  return {
    subscriberHealth: proMode,
    growthRecommendations: proMode,
    revenueOutlook: proMode,
    platformRiskExplanation: proMode,
    wowSummary: reportMode,
    opportunity: reportMode,
    strengthsRisks: reportMode,
    nextActions: reportMode,
  };
}

export function canRenderReportDetailProContent(mode: ReportDetailProSectionMode): boolean {
  return mode === "pro-unlocked";
}

export function canRenderReportDetailReportContent(mode: ReportDetailReportSectionMode): boolean {
  return mode === "report-unlocked";
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
