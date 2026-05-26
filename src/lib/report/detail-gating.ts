import type { EntitlementsResponse } from "../api/entitlements";
import type { AppGateState } from "../gating/app-gate";
import {
  canDownloadPdfFromEntitlement,
  canViewOwnedReportFromEntitlement,
  hasProEquivalentEntitlement,
  isFounderFromEntitlement,
} from "../entitlements/model";

export type ReportDetailProSectionMode = "pro-unlocked" | "pro-locked" | "loading-safe";
export type ReportDetailReportSectionMode = "report-unlocked" | "report-locked" | "loading-safe";
export type ReportDetailPdfAccessMode = "pdf-unlocked" | "pdf-locked" | "loading-safe";

export type ReportDetailSectionGatingModel = {
  subscriberHealth: ReportDetailProSectionMode;
  growthRecommendations: ReportDetailProSectionMode;
  revenueOutlook: ReportDetailProSectionMode;
  platformRiskExplanation: ReportDetailProSectionMode;
  // Pro-only sections — Report-tier users see ProGate blur + upgrade CTA.
  opportunity: ReportDetailProSectionMode;
  strengthsRisks: ReportDetailProSectionMode;
  nextActions: ReportDetailProSectionMode;
  // Report-tier visible sections.
  wowSummary: ReportDetailReportSectionMode;
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

  if (isFounderFromEntitlement(entitlements)) {
    return "pro-unlocked";
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

  if (isFounderFromEntitlement(entitlements)) {
    return "report-unlocked";
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
    // These sections are Pro-only — Report-tier users see a ProGate blur + upgrade CTA.
    opportunity: proMode,
    strengthsRisks: proMode,
    nextActions: proMode,
    // wowSummary (business snapshot overview) remains visible at Report tier.
    wowSummary: reportMode,
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

  if (isFounderFromEntitlement(entitlements)) {
    return "pdf-unlocked";
  }

  return canDownloadPdfFromEntitlement(entitlements) ? "pdf-unlocked" : "pdf-locked";
}

export function resolveReportDetailPdfAccessMode(input: BuildReportDetailSectionGatingInput): ReportDetailPdfAccessMode {
  return resolvePdfAccessMode(input.gateState, input.entitlements);
}

export function canAccessFullReportPdf(mode: ReportDetailPdfAccessMode): boolean {
  return mode === "pdf-unlocked";
}
