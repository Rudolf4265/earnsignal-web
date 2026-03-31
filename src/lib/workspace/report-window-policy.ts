import type { ReportModeAllowed } from "../entitlements/model";
import { fromMonthIndex, normalizeCoverageMonths, toMonthIndex } from "./coverage-months";

export type AnalysisWindowMode = "full_history" | "latest_3_months";

export type AnalysisWindowOption = {
  mode: AnalysisWindowMode;
  startMonth: string | null;
  endMonth: string | null;
};

export type SnapshotWindowOption = {
  startMonth: string;
  endMonth: string;
};

export type WorkspaceReportWindowPolicy = {
  reportModeAllowed: ReportModeAllowed;
  maxReportMonths: number | null;
  canUseFullHistoryWindow: boolean;
  coverageMonths: number | null;
  hasCoverageBeyondPlanLimit: boolean;
  requiresWindowChooser: boolean;
  directRunMode: AnalysisWindowMode | null;
  runCtaLabel: string;
  summaryNote: string | null;
  latestSnapshotWindow: SnapshotWindowOption | null;
  snapshotWindowOptions: SnapshotWindowOption[];
  canChooseCustomSnapshot: boolean;
  showUpgradeToPro: boolean;
};

type ResolveWorkspaceReportWindowPolicyInput = {
  reportModeAllowed: ReportModeAllowed;
  maxReportMonths: number | null;
  canUseFullHistoryWindow: boolean;
  coverageMonths: number | null;
  coverageStart: string | null;
  coverageEnd: string | null;
  monthsPresent: string[];
};

function buildSnapshotWindowOptions(months: string[]): SnapshotWindowOption[] {
  if (months.length < 3) {
    return [];
  }

  const monthSet = new Set(months);
  const options: SnapshotWindowOption[] = [];
  for (const startMonth of months) {
    const startIndex = toMonthIndex(startMonth);
    const secondMonth = fromMonthIndex(startIndex + 1);
    const thirdMonth = fromMonthIndex(startIndex + 2);
    if (!monthSet.has(secondMonth) || !monthSet.has(thirdMonth)) {
      continue;
    }

    options.push({
      startMonth,
      endMonth: thirdMonth,
    });
  }

  return options;
}

export function resolveWorkspaceReportWindowPolicy(
  input: ResolveWorkspaceReportWindowPolicyInput,
): WorkspaceReportWindowPolicy {
  const snapshotLimit = input.maxReportMonths;
  const canonicalCoverageMonths = normalizeCoverageMonths(input.monthsPresent, input.coverageStart, input.coverageEnd);
  const resolvedCoverageMonths = canonicalCoverageMonths.length > 0 ? canonicalCoverageMonths.length : input.coverageMonths;
  const hasExtendedCoverage = typeof resolvedCoverageMonths === "number" && resolvedCoverageMonths > 3;
  const snapshotWindowOptions = buildSnapshotWindowOptions(canonicalCoverageMonths);
  const latestSnapshotWindow = snapshotWindowOptions[snapshotWindowOptions.length - 1] ?? null;
  const hasCoverageBeyondPlanLimit =
    typeof resolvedCoverageMonths === "number" &&
    typeof snapshotLimit === "number" &&
    snapshotLimit > 0 &&
    resolvedCoverageMonths > snapshotLimit;

  if (input.canUseFullHistoryWindow || input.reportModeAllowed === "continuous") {
    return {
      reportModeAllowed: input.reportModeAllowed,
      maxReportMonths: input.maxReportMonths,
      canUseFullHistoryWindow: input.canUseFullHistoryWindow,
      coverageMonths: resolvedCoverageMonths,
      hasCoverageBeyondPlanLimit,
      requiresWindowChooser: false,
      directRunMode: hasExtendedCoverage ? "full_history" : null,
      runCtaLabel: hasExtendedCoverage ? "Run Full-history Report" : "Run Report",
      summaryNote: hasExtendedCoverage ? "Full-history analysis is available for this staged workspace." : null,
      latestSnapshotWindow,
      snapshotWindowOptions,
      canChooseCustomSnapshot: snapshotWindowOptions.length > 1,
      showUpgradeToPro: false,
    };
  }

  const requiresWindowChooser =
    input.reportModeAllowed === "snapshot" &&
    hasCoverageBeyondPlanLimit &&
    latestSnapshotWindow !== null;

  return {
    reportModeAllowed: input.reportModeAllowed,
    maxReportMonths: input.maxReportMonths,
    canUseFullHistoryWindow: input.canUseFullHistoryWindow,
    coverageMonths: resolvedCoverageMonths,
    hasCoverageBeyondPlanLimit,
    requiresWindowChooser,
    directRunMode: null,
    runCtaLabel: requiresWindowChooser ? "Choose analysis window" : "Run Report",
    summaryNote: requiresWindowChooser ? "Report includes a focused 3-month business diagnostic." : null,
    latestSnapshotWindow,
    snapshotWindowOptions,
    canChooseCustomSnapshot: snapshotWindowOptions.length > 1,
    showUpgradeToPro: requiresWindowChooser,
  };
}
