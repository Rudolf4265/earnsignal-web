import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const dashboardUtilitySectionPath = path.resolve("app/(app)/app/_components/dashboard/DashboardUtilitySection.tsx");

test("dashboard utility section keeps lower-priority account and workspace cards together", async () => {
  const source = await readFile(dashboardUtilitySectionPath, "utf8");

  assert.equal(source.includes('data-testid="dashboard-section-workspace-overview"'), true);
  assert.equal(source.includes("Plan & access"), true);
  assert.equal(source.includes("Workspace status"), true);
  assert.equal(source.includes("Connected data"), true);
  assert.equal(source.includes("Latest report"), true);
  assert.equal(source.includes("Lower-priority account and workspace details live here"), true);
  assert.equal(source.includes("reportsCheckError"), true);
});
