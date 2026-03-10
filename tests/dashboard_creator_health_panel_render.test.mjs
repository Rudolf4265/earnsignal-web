import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const creatorHealthPanelPath = path.resolve("app/(app)/app/_components/dashboard/CreatorHealthPanel.tsx");

test("creator health panel keeps hero score, trajectory line, and utility cards", async () => {
  const source = await readFile(creatorHealthPanelPath, "utf8");

  assert.equal(source.includes("DashboardSectionHeader"), false);
  assert.equal(source.includes("A simple pulse on how your creator business is doing right now."), false);
  assert.equal(source.includes("Creator Health Score"), true);
  assert.equal(source.includes('data-testid="creator-health-trajectory"'), true);
  assert.equal(source.includes("Plan & Access"), true);
  assert.equal(source.includes("Workspace Readiness"), true);
  assert.equal(source.includes("Data Footprint"), true);
  assert.equal(source.includes("Latest Report"), true);
  assert.equal(source.includes("Gated state"), true);
});
