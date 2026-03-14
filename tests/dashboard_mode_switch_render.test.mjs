import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const dashboardPagePath = path.resolve("app/(app)/app/page.tsx");
const dashboardOnboardingPath = path.resolve("app/(app)/app/_components/dashboard/DashboardOnboardingSection.tsx");
const modeSwitchPath = path.resolve("src/components/dashboard/mode-switch.tsx");
const growSectionPath = path.resolve("app/(app)/app/_components/dashboard/GrowDashboardSection.tsx");

test("dashboard page wires additive Earn and Grow mode branching without disturbing the existing earn path", async () => {
  const source = await readFile(dashboardPagePath, "utf8");

  assert.equal(source.includes("const dashboardMode = parseDashboardMode(searchParams.get(\"mode\"));"), true);
  assert.equal(source.includes("<DashboardModeSwitch mode={dashboardMode} onChange={handleModeChange} />"), true);
  assert.equal(source.includes("buildDashboardModeSearch(searchParams, nextMode)"), true);
  assert.equal(source.includes("{dashboardMode === \"earn\" ? ("), true);
  assert.equal(source.includes("<RevenueSnapshotSection revenueSnapshot={earnDashboardModel.revenueSnapshot} />"), true);
  assert.equal(source.includes("<GrowDashboardSection"), true);
  assert.equal(source.includes("const primaryCta = useMemo("), true);
  assert.equal(source.includes("const latestReportHref = useMemo(() => buildReportDetailPathOrIndex(state.latestReportRow?.id), [state.latestReportRow?.id]);"), true);
  assert.equal(source.includes("const showDashboardOnboarding = state.hasReports !== true || growGuidanceLimited;"), true);
  assert.equal(source.includes("<DashboardOnboardingSection"), true);
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
  assert.equal(source.includes("Earn tracks revenue, subscriptions, and monetization health from the latest report."), true);
  assert.equal(source.includes("Grow is the audience and engagement side. Richer scorecards appear when supported analytics are available."), true);
  assert.equal(source.includes("/app/help#upload-guide"), true);
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
  assert.equal(source.includes("Grow is not ready for this workspace yet."), true);
  assert.equal(
    source.includes("Earn is available now. Grow will unlock when supported audience and engagement analytics are added."),
    true,
  );
  assert.equal(source.includes("Upload Patreon and Substack analytics to unlock growth insights."), false);
  assert.equal(source.includes("Upload Instagram, TikTok, or YouTube analytics to unlock growth insights."), false);
});
