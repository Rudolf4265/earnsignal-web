import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const insightCardsSectionPath = path.resolve("app/(app)/app/_components/dashboard/InsightCardsSection.tsx");

test("insight cards section includes graceful empty state copy", async () => {
  const source = await readFile(insightCardsSectionPath, "utf8");

  assert.equal(source.includes('data-testid="dashboard-insights-empty"'), true);
  assert.equal(source.includes("Not enough signal data is available yet."), true);
  assert.equal(source.includes("Narrative insight cards will appear here after your next completed report."), true);
});

test("insight cards section renders narrative fields for signal and implication", async () => {
  const source = await readFile(insightCardsSectionPath, "utf8");

  assert.equal(source.includes(">Signal<"), true);
  assert.equal(source.includes(">Why it matters<"), true);
  assert.equal(source.includes("break-words"), true);
});
