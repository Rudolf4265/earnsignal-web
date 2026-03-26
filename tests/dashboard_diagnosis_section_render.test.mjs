import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const dashboardPagePath = path.resolve("app/(app)/app/page.tsx");
const diagnosisSectionPath = path.resolve("app/(app)/app/_components/dashboard/DiagnosisSection.tsx");

test("dashboard page still builds typed diagnosis and comparison context from report truth", async () => {
  const source = await readFile(dashboardPagePath, "utf8");

  assert.equal(source.includes("buildDashboardDiagnosisViewModel"), true);
  assert.equal(source.includes("diagnosis: state.latestArtifact?.diagnosis ?? state.latestReport?.diagnosis ?? null"), true);
  assert.equal(source.includes("whatChanged: state.latestArtifact?.whatChanged ?? state.latestReport?.whatChanged ?? null"), true);
  assert.equal(source.includes("hasReport: state.latestReport !== null"), true);
  assert.equal(source.includes("diagnosisNotice={diagnosisViewModel.notice}"), true);
  assert.equal(source.includes("diagnosis={diagnosisViewModel}"), true);
});

test("diagnosis section includes loading-safe, honest summary, unavailable, notice, and bounded context branches", async () => {
  const source = await readFile(diagnosisSectionPath, "utf8");

  assert.equal(source.includes('data-testid="dashboard-diagnosis-section"'), true);
  assert.equal(source.includes('data-testid="dashboard-diagnosis-loading"'), true);
  assert.equal(source.includes('testId="dashboard-diagnosis-notice"'), true);
  assert.equal(source.includes('data-testid="dashboard-diagnosis-summary"'), true);
  assert.equal(source.includes('data-testid="dashboard-diagnosis-unavailable"'), true);
  assert.equal(source.includes('data-testid="dashboard-diagnosis-context"'), true);
  assert.equal(source.includes('data-testid="dashboard-diagnosis-supporting-metrics"'), true);
  assert.equal(source.includes("From current report evidence"), true);
  assert.equal(source.includes("Latest report diagnosis"), true);
  assert.equal(source.includes('presentation?: "default" | "hero"'), true);
  assert.equal(source.includes("Current primary constraint from typed report evidence, bounded by the available report data."), true);
});
