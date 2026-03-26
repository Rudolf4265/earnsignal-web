import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const wowSummaryPath = path.resolve("app/(app)/app/report/[id]/_components/ReportWowSummary.tsx");

test("report wow summary renders the coverage and trust panel from report truth metadata", async () => {
  const source = await readFile(wowSummaryPath, "utf8");

  assert.equal(source.includes('data-testid="wow-coverage-trust"'), true);
  assert.equal(source.includes("Coverage"), true);
  assert.equal(source.includes("model.coverage.snapshotCoverageNote"), true);
  assert.equal(source.includes("model.coverage.reportHasBusinessMetrics === false"), true);
  assert.equal(source.includes("Limited by available business metrics"), true);
  assert.equal(source.includes("model.coverage.sectionStrength.map"), true);
});
