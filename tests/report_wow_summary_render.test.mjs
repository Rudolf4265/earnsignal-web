import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const wowSummaryPath = path.resolve("app/(app)/app/report/[id]/_components/ReportWowSummary.tsx");

test("report wow summary does not render a coverage/trust panel (removed as redundant system output)", async () => {
  const source = await readFile(wowSummaryPath, "utf8");

  assert.equal(source.includes('data-testid="wow-coverage-trust"'), false);
  assert.equal(source.includes("CoverageTrustPanel"), false);
});

test("report wow summary renders the biggest risk card", async () => {
  const source = await readFile(wowSummaryPath, "utf8");

  assert.equal(source.includes('data-testid="wow-biggest-risk"'), true);
  assert.equal(source.includes("BiggestRiskCard"), true);
  assert.equal(source.includes("Biggest risk"), true);
});

test("report wow summary uses recommended actions wording", async () => {
  const source = await readFile(wowSummaryPath, "utf8");

  assert.equal(source.includes("Recommended Actions"), true);
  assert.equal(source.includes("Recommended actions are not available in this report."), true);
});
