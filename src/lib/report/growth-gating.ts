import type { EntitlementsResponse } from "../api/entitlements";
import type { AppGateState } from "../gating/app-gate";
import { hasProEquivalentEntitlement, isFounderFromEntitlement, canViewOwnedReportFromEntitlement } from "../entitlements/model";

/**
 * Growth Report section gating model.
 *
 * Three tiers map to section visibility:
 *
 *  Free    — growthSnapshot, whatWeCanMeasure, whatUnlocksNext are unlocked.
 *            All other sections show a "report-locked" upgrade prompt.
 *            The backend returns data for all sections regardless; gating is
 *            applied here in the frontend.
 *
 *  Report  — full Growth Report. All sections unlocked, including
 *            Recommended Actions. This is a complete, purchased artifact.
 *
 *  Pro     — same as Report for Growth Report sections at MVP.
 *            Pro differentiation is delivered through repeat runs, history,
 *            and cross-report comparisons — not by withholding core sections.
 *
 * - "unlocked"      — render the section
 * - "report-locked" — requires Report or Pro; show upgrade prompt
 * - "loading-safe"  — entitlement state not yet resolved; render skeleton
 */
export type GrowthSectionMode = "unlocked" | "report-locked" | "loading-safe";

export type GrowthReportSectionGatingModel = {
  /** Always visible for any authenticated user */
  growthSnapshot: GrowthSectionMode;
  whatWeCanMeasure: GrowthSectionMode;
  whatUnlocksNext: GrowthSectionMode;
  /** Report+ (Report and Pro are identical at MVP) */
  audienceSignals: GrowthSectionMode;
  contentPerformance: GrowthSectionMode;
  growthConstraints: GrowthSectionMode;
  confidenceNote: GrowthSectionMode;
  recommendedActions: GrowthSectionMode;
};

function resolveLoadingSafe(gateState: AppGateState, entitlements: EntitlementsResponse | null): boolean {
  return (
    gateState === "session_loading" ||
    gateState === "authed_loading_entitlements" ||
    gateState === "anon" ||
    gateState === "session_expired" ||
    gateState === "entitlements_error" ||
    entitlements === null
  );
}

export function buildGrowthReportSectionGatingModel(
  gateState: AppGateState,
  entitlements: EntitlementsResponse | null,
): GrowthReportSectionGatingModel {
  if (resolveLoadingSafe(gateState, entitlements)) {
    return {
      growthSnapshot: "loading-safe",
      whatWeCanMeasure: "loading-safe",
      whatUnlocksNext: "loading-safe",
      audienceSignals: "loading-safe",
      contentPerformance: "loading-safe",
      growthConstraints: "loading-safe",
      confidenceNote: "loading-safe",
      recommendedActions: "loading-safe",
    };
  }

  const isFounder = isFounderFromEntitlement(entitlements);
  // Report and Pro both get the full Growth Report at MVP.
  const hasReportOrPro =
    isFounder ||
    canViewOwnedReportFromEntitlement(entitlements) ||
    hasProEquivalentEntitlement(entitlements);

  return {
    // Always unlocked: Free users see a meaningful teaser
    growthSnapshot: "unlocked",
    whatWeCanMeasure: "unlocked",
    whatUnlocksNext: "unlocked",
    // Full report: Report and Pro are identical at MVP
    audienceSignals: hasReportOrPro ? "unlocked" : "report-locked",
    contentPerformance: hasReportOrPro ? "unlocked" : "report-locked",
    growthConstraints: hasReportOrPro ? "unlocked" : "report-locked",
    confidenceNote: hasReportOrPro ? "unlocked" : "report-locked",
    recommendedActions: hasReportOrPro ? "unlocked" : "report-locked",
  };
}

export function isGrowthSectionUnlocked(mode: GrowthSectionMode): boolean {
  return mode === "unlocked";
}
