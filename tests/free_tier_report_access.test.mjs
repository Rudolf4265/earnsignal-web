import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { decideFeatureGuardOutcome } from "../src/lib/gating/feature-guard-decision.mjs";

const reportPagePath = path.resolve("app/(app)/app/report/[id]/page.tsx");
const reportFreeTeaserPath = path.resolve("app/(app)/app/report/[id]/_components/ReportFreeTeaser.tsx");
const featureGuardPath = path.resolve("app/(app)/_components/feature-guard.tsx");
const uploadStepperPath = path.resolve("app/(app)/app/_components/upload/upload-stepper.tsx");

// ── Part 1: Route guard allows free users ────────────────────────────────────

test("free user (authed_unentitled) can access /app/report — guard returns render_children", () => {
  const outcome = decideFeatureGuardOutcome({ gateState: "authed_unentitled", pathname: "/app/report", feature: "report" });
  assert.equal(outcome.kind, "render_children");
  assert.notEqual(outcome.kind, "redirect");
});

test("free user (authed_unentitled) can access /app/report/[id] — guard returns render_children", () => {
  const outcome = decideFeatureGuardOutcome({ gateState: "authed_unentitled", pathname: "/app/report/abc123def", feature: "report" });
  assert.equal(outcome.kind, "render_children");
  assert.notEqual(outcome.kind, "redirect");
});

test("free user is NOT redirected to billing when accessing any /app/report subpath", () => {
  const subpaths = ["/app/report", "/app/report/1", "/app/report/abc-123", "/app/report/a/b"];
  for (const pathname of subpaths) {
    const outcome = decideFeatureGuardOutcome({ gateState: "authed_unentitled", pathname, feature: "report" });
    assert.notEqual(outcome.kind, "redirect", `Expected render_children for ${pathname}, got redirect`);
  }
});

test("guard still blocks non-report routes for authed_unentitled users", () => {
  const blockedPaths = ["/app/dashboard", "/app/history", "/app/pro-features"];
  for (const pathname of blockedPaths) {
    const outcome = decideFeatureGuardOutcome({ gateState: "authed_unentitled", pathname, feature: "report" });
    assert.equal(outcome.kind, "redirect", `Expected redirect for ${pathname}`);
  }
});

test("anon users are still redirected to login even for /app/report routes", () => {
  const outcome = decideFeatureGuardOutcome({ gateState: "anon", pathname: "/app/report/abc", feature: "report" });
  assert.equal(outcome.kind, "redirect");
  assert.equal(outcome.href.startsWith("/login"), true);
});

test("session loading state still shows loading for report routes", () => {
  const outcome = decideFeatureGuardOutcome({ gateState: "session_loading", pathname: "/app/report/abc", feature: "report" });
  assert.equal(outcome.kind, "render_loading");
});

// ── Part 2: Report page uses component-level gating, not route-level ─────────

test("report page uses showFullReportContent to gate content — not a redirect", async () => {
  const source = await readFile(reportPagePath, "utf8");

  assert.equal(source.includes("showFullReportContent"), true);
  assert.equal(source.includes("canRenderReportDetailReportContent"), true);
  // Must not contain any programmatic navigation to billing (router.replace/push to billing)
  assert.equal(source.includes("router.replace(\"/app/billing"), false);
  assert.equal(source.includes("router.push(\"/app/billing"), false);
});

test("report page renders ReportFreeTeaser for free users, not a redirect callout", async () => {
  const source = await readFile(reportPagePath, "utf8");

  // Page should conditionally render the teaser
  assert.equal(source.includes("ReportFreeTeaser"), true);
  assert.equal(source.includes('proSectionGate.wowSummary === "report-locked"'), true);
  assert.equal(source.includes("freeTeaserModel"), true);
});

test("report page does not branch on authed_unentitled to redirect free users", async () => {
  const source = await readFile(reportPagePath, "utf8");

  // The page must not inspect gateState === "authed_unentitled" to make routing decisions
  // (gating is handled by showFullReportContent from detail-gating.ts, not by gate state)
  assert.equal(source.includes('gateState === "authed_unentitled"'), false);
  // Must not have a hard-coded redirect to billing inside the report page component
  assert.equal(source.includes("router.replace(\"/app/billing"), false);
});

// ── Part 3: ReportFreeTeaser is reachable and complete ───────────────────────

test("ReportFreeTeaser has root testId and is a proper component", async () => {
  const source = await readFile(reportFreeTeaserPath, "utf8");

  assert.equal(source.includes('data-testid="report-free-teaser"'), true);
  assert.equal(source.includes('data-testid="report-free-teaser-upgrade-cta"'), true);
  assert.equal(source.includes('data-testid="report-free-teaser-locked-sections"'), true);
  assert.equal(source.includes('data-testid="report-free-teaser-pro-upsell"'), true);
});

test("ReportFreeTeaser upgrade CTA points to /app/billing", async () => {
  const source = await readFile(reportFreeTeaserPath, "utf8");

  assert.equal(source.includes('href="/app/billing"'), true);
});

test("ReportFreeTeaser does not expose specific revenue amounts or paid metric values", async () => {
  const source = await readFile(reportFreeTeaserPath, "utf8");

  // Safe signals — platform count (boolean), hasRevenueSignals (boolean)
  // Must NOT render metric.value or concentrationScore directly
  assert.equal(source.includes("concentrationScore"), false);
  assert.equal(source.includes("metric.value"), false);
});

test("ReportFreeTeaser is imported and used in the report page", async () => {
  const source = await readFile(reportPagePath, "utf8");

  assert.equal(source.includes('from "./_components/ReportFreeTeaser"'), true);
  assert.equal(source.includes("<ReportFreeTeaser"), true);
});

// ── Part 4: Free user does NOT see paid content sections ─────────────────────

test("report page gates wow summary behind showFullReportContent", async () => {
  const source = await readFile(reportPagePath, "utf8");

  // Wow summary only renders when showFullReportContent is true
  assert.equal(source.includes("showFullReportContent && wowSummary"), true);
  assert.equal(source.includes("<ReportWowSummary"), true);
});

test("report page gates hero metrics behind showFullReportContent", async () => {
  const source = await readFile(reportPagePath, "utf8");

  assert.equal(source.includes("showFullReportContent ? ("), true);
  assert.equal(source.includes("heroMetrics.map"), true);
});

test("report page gates content sections (executive summary through appendix) behind showFullReportContent", async () => {
  const source = await readFile(reportPagePath, "utf8");

  assert.equal(source.includes("showFullReportContent ? ("), true);
  assert.equal(source.includes('data-testid="report-what-to-do-next"'), true);
});

test("report page gates PDF download behind pdfAccessMode", async () => {
  const source = await readFile(reportPagePath, "utf8");

  assert.equal(source.includes("pdfAccessMode"), true);
  assert.equal(source.includes('pdf-locked'), true);
  assert.equal(source.includes("canAccessFullReportPdf"), true);
});

// ── Part 4: Upload flow alignment ────────────────────────────────────────────

test("upload stepper no longer derives View report from upload status state", async () => {
  const source = await readFile(uploadStepperPath, "utf8");

  assert.equal(source.includes("View report preview"), false);
  assert.equal(source.includes('data-testid="upload-run-report"'), false);
  assert.equal(source.includes("latestTerminalUpload.reportId"), false);
});

test("upload stepper summary banner defers report execution to the final workspace step", async () => {
  const source = await readFile(uploadStepperPath, "utf8");

  assert.equal(source.includes('data-testid="upload-completed-run-report"'), false);
  assert.equal(source.includes("workspaceReportState.canRunReport"), true);
  assert.equal(source.includes("Review your staged sources below, then run the report from the final step."), true);
});

test("upload stepper still shows billing link when validated and report generation is locked", async () => {
  const source = await readFile(uploadStepperPath, "utf8");

  assert.equal(source.includes("Unlock report"), true);
  assert.equal(source.includes('href="/app/billing"'), true);
});

// ── Part 5: Upgrade path originates from teaser ──────────────────────────────

test("primary upgrade CTA is inside ReportFreeTeaser, not a route-level redirect", async () => {
  const teaserSource = await readFile(reportFreeTeaserPath, "utf8");
  const guardSource = await readFile(featureGuardPath, "utf8");

  // Teaser has the billing CTA
  assert.equal(teaserSource.includes('href="/app/billing"'), true);
  assert.equal(teaserSource.includes("View plans"), true);

  // Feature guard does NOT redirect for /app/report (the decision logic handles this)
  // The guard's redirect branch shows NotEntitledCallout for non-report guarded pages
  assert.equal(guardSource.includes('case "redirect":'), true);
  assert.equal(guardSource.includes("return <NotEntitledCallout />;"), true);
});

// ── Feature guard component renders children (not NotEntitledCallout) for report routes ──

test("feature guard decision returns render_children for authed_entitled users on all routes", () => {
  const routes = ["/app/report/abc", "/app/billing", "/app/dashboard", "/app/data"];
  for (const pathname of routes) {
    const outcome = decideFeatureGuardOutcome({ gateState: "authed_entitled", pathname, feature: "report" });
    assert.equal(outcome.kind, "render_children", `Expected render_children for ${pathname}`);
  }
});
