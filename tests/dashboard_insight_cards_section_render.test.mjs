import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const insightCardsSectionPath = path.resolve("app/(app)/app/_components/dashboard/InsightCardsSection.tsx");

test("insight cards section includes graceful empty state copy", async () => {
  const source = await readFile(insightCardsSectionPath, "utf8");

  assert.equal(source.includes('data-testid="dashboard-insights-empty"'), true);
  assert.equal(source.includes("New insight cards appear after a completed report with enough evidence to summarize the pattern clearly."), true);
});

test("insight cards section renders narrative fields for body, implication, and state detail", async () => {
  const source = await readFile(insightCardsSectionPath, "utf8");

  assert.equal(source.includes("insight.title"), true);
  assert.equal(source.includes("insight.body"), true);
  assert.equal(source.includes("Why it matters"), true);
  assert.equal(source.includes("insight.implication"), true);
  assert.equal(source.includes("insight.stateLabel"), true);
  assert.equal(source.includes("insight.stateDetail"), true);
  assert.equal(source.includes("break-words"), true);
});
