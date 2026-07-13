import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const dashboardPagePath = path.resolve("app/(app)/app/dashboard/page.tsx");
const dashboardOnboardingPath = path.resolve("app/(app)/app/_components/dashboard/DashboardOnboardingSection.tsx");
const modeSwitchPath = path.resolve("src/components/dashboard/mode-switch.tsx");
const growSectionPath = path.resolve("app/(app)/app/_components/dashboard/GrowDashboardSection.tsx");
const growthReportPagePath = path.resolve("app/(app)/app/report/growth/page.tsx");

test("dashboard page wires the flat single-view strips without a mode split", async () => {
  const source = await readFile(dashboardPagePath, "utf8");

  assert.equal(source.includes("<DashboardHeader"), true);
  assert.equal(source.includes("planBadgeLabel={dashboardPlanBadgeLabel}"), true);
  assert.equal(source.includes("tierBanner={dashboardTierBanner}"), true);
  assert.equal(source.includes("<DashboardKpiStrip"), true);
  assert.equal(source.includes("<DashboardWhatsHappening"), true);
  assert.equal(source.includes("<RevenueTrendSection"), true);
  assert.equal(source.includes("<DashboardNextMoveSection"), true);
  assert.equal(source.includes("const primaryCta = useMemo("), true);
  assert.equal(source.includes("buildReportDetailPathOrIndex(state.latestReportRow?.id)"), true);
  assert.equal(source.includes("const showDashboardOnboarding = state.hasReports !== true;"), true);
  assert.equal(source.includes("<DashboardOnboardingSection"), true);
  // The Earn/Grow mode split was intentionally removed in the flat dashboard redesign.
  assert.equal(source.includes("parseDashboardMode"), false);
  assert.equal(source.includes("buildDashboardModeSearch"), false);
  assert.equal(source.includes("<GrowDashboardSection"), false);
});

test("dashboard page derives report snapshot and Pro continuity header treatment from entitlements", async () => {
  const source = await readFile(dashboardPagePath, "utf8");

  assert.equal(source.includes("const hasProDashboardTreatment = entitlementState.hasProAccess || entitlementState.isFounder;"), true);
  assert.equal(source.includes("entitled && !hasProDashboardTreatment"), true);
  assert.equal(source.includes('entitlementState.effectivePlanTier === "report"'), true);
  assert.equal(source.includes('const dashboardPlanBadgeLabel = hasProDashboardTreatment ? "Pro" : null;'), true);
  assert.equal(source.includes('eyebrow: "Snapshot companion"'), true);
  assert.equal(source.includes('body: "This dashboard reflects your purchased report snapshot. Upgrade to Pro for ongoing intelligence, comparisons, and monitoring."'), true);
  assert.equal(source.includes('testId: "dashboard-report-snapshot-banner"'), true);
});

test("dashboard mode switch exposes explicit Earn and Grow tab controls", async () => {
  const source = await readFile(modeSwitchPath, "utf8");

  assert.equal(source.includes('data-testid="dashboard-mode-switch"'), true);
  assert.equal(source.includes('role="tablist"'), true);
  assert.equal(source.includes('aria-label="Dashboard mode"'), true);
  assert.equal(source.includes('label: "Earn"'), true);
  assert.equal(source.includes('label: "Grow"'), true);
  assert.equal(source.includes('data-testid="dashboard-mode-explainer"'), true);
  assert.equal(source.includes("Revenue, subscriptions, and monetization health."), true);
  assert.equal(source.includes("Audience and engagement guidance with richer scorecards when supported analytics are available."), true);
  assert.equal(
    source.includes("Grow is the audience and engagement side, and richer scorecards appear when supported analytics are available."),
    true,
  );
  assert.equal(source.includes('data-testid={`dashboard-mode-${option.id}`}'), true);
});

test("dashboard onboarding section explains the product, modes, and next-step guidance", async () => {
  const source = await readFile(dashboardOnboardingPath, "utf8");

  assert.equal(source.includes('data-testid="dashboard-onboarding-section"'), true);
  assert.equal(source.includes('data-testid="dashboard-onboarding-how-it-works"'), true);
  assert.equal(source.includes('data-testid="dashboard-onboarding-mode-guide"'), true);
  assert.equal(source.includes('data-testid="dashboard-onboarding-next-step"'), true);
  assert.equal(source.includes('data-testid="dashboard-onboarding-help-link"'), true);
  assert.equal(source.includes("Quick start"), true);
  assert.equal(source.includes("EarnSigma in one minute"), true);
  assert.equal(source.includes("getSupportedRevenueUploadFormatGuidance"), true);
  assert.equal(source.includes("Start with a supported upload."), true);
  assert.equal(source.includes("Upload a supported file from your creator revenue workflow."), true);
  assert.equal(source.includes("run a combined report when you are ready"), true);
  assert.equal(source.includes("supported CSV upload"), false);
  assert.equal(source.includes("Earn tracks revenue, subscriptions, and monetization health from the latest report."), true);
  assert.equal(source.includes("Grow is the audience and engagement side. Richer scorecards appear when supported analytics are available."), true);
  assert.equal(source.includes("Currently supported uploads are ${supportedRevenueUploads}."), true);
  assert.equal(source.includes("${supportedRevenueUploadFormatGuidance}"), true);
  assert.equal(source.includes("Instagram uploads"), false);
  assert.equal(source.includes("TikTok uploads"), false);
  assert.equal(source.includes("/app/help#upload-guide"), true);
});

test("dashboard page empty-state readiness copy stays aligned with supported upload wording", async () => {
  const source = await readFile(dashboardPagePath, "utf8");

  assert.equal(source.includes("Run a report to unlock your latest dashboard snapshot."), true);
  assert.equal(source.includes("Loading your latest dashboard snapshot."), true);
  assert.equal(source.includes("fresh supported CSV"), false);
});

test("grow dashboard section uses truthful empty and partial states", async () => {
  const source = await readFile(growSectionPath, "utf8");

  assert.equal(source.includes('data-testid="grow-dashboard-loading"'), true);
  assert.equal(source.includes('data-testid="grow-dashboard-empty"'), true);
  assert.equal(source.includes('data-testid="grow-dashboard-hero"'), true);
  assert.equal(source.includes('data-testid="grow-dashboard-partial"'), true);
  assert.equal(source.includes('data-testid="grow-dashboard-posting-window"'), true);
  assert.equal(source.includes('data-testid="grow-dashboard-what-grow-shows"'), true);
  assert.equal(source.includes('data-testid="grow-dashboard-playbook"'), true);
  assert.equal(source.includes('data-testid="grow-dashboard-guidance"'), true);
  assert.equal(source.includes('data-testid="grow-dashboard-playbook-locked"'), true);
  assert.equal(source.includes('data-testid="grow-dashboard-playbook-loading"'), true);
  assert.equal(source.includes("model.creatorScore ? ("), true);
  assert.equal(source.includes("Add audience data to unlock growth insights."), true);
  assert.equal(source.includes("Growth insights based on your available audience data."), true);
  assert.equal(source.includes("Upload Patreon and Substack analytics to unlock growth insights."), false);
  assert.equal(source.includes("Upload Instagram, TikTok, or YouTube analytics to unlock growth insights."), false);
});

test("Grow score cards label the preferred social score as Creator Score", async () => {
  const [growSectionSource, growthReportSource] = await Promise.all([
    readFile(growSectionPath, "utf8"),
    readFile(growthReportPagePath, "utf8"),
  ]);

  assert.equal(growSectionSource.includes("Creator Score"), true);
  assert.equal(growthReportSource.includes("Creator Score"), true);
  assert.equal(growSectionSource.includes("Based on your available audience and engagement data."), true);
  assert.equal(growthReportSource.includes("Based on your available audience and engagement data."), true);
});
