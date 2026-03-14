import type { DashboardActionCardsViewModel } from "../dashboard/action-cards";
import type { DashboardDiagnosisViewModel } from "../dashboard/diagnosis";
import type { EarnDashboardModel } from "../dashboard/earn-model";
import type { GrowDashboardModel } from "../dashboard/grow-model";
import type { DashboardInsightCard } from "../dashboard/insights";
import type { DashboardMode } from "../dashboard/mode";
import type { DashboardRevenueTrendViewModel } from "../dashboard/revenue-trend";

export type DemoBadgeVariant = "good" | "warn" | "neutral";

export type DemoLatestReportRow = {
  id: string;
  date: string;
  status: string;
};

export type DemoWorkspaceUtilityModel = {
  entitled: boolean;
  planTier: string;
  planStatusLabel: string;
  planStatusVariant: DemoBadgeVariant;
  workspaceReadiness: string;
  reportsCheckError: string | null;
  platformsConnectedLabel: string;
  coverageLabel: string;
  lastUploadLabel: string;
  latestReportRow: DemoLatestReportRow | null;
  latestReportHref: string;
  latestReportStatusLabel: string;
  latestReportStatusVariant: DemoBadgeVariant;
};

export type DemoSampleReport = {
  anchorId: string;
  title: string;
  generatedAtLabel: string;
  summary: string;
  highlights: string[];
  nextSteps: string[];
};

export type DemoWorkspaceDashboardModel = {
  primaryCtaLabel: string;
  primaryCtaHref: string;
  hasUpload: boolean;
  hasReports: boolean | null;
  earn: {
    model: EarnDashboardModel;
    diagnosis: DashboardDiagnosisViewModel;
    actionCards: DashboardActionCardsViewModel;
    insights: DashboardInsightCard[];
    revenueTrend: DashboardRevenueTrendViewModel;
    trendPreview: string | null;
  };
  grow: {
    model: GrowDashboardModel | null;
  };
  utility: DemoWorkspaceUtilityModel;
};

export type DemoWorkspaceFixture = {
  id: string;
  shortLabel: string;
  label: string;
  focusLabel: string;
  stateLabel: string;
  scenario: string;
  description: string;
  defaultMode: DashboardMode;
  dashboard: DemoWorkspaceDashboardModel;
  sampleReport: DemoSampleReport | null;
};
