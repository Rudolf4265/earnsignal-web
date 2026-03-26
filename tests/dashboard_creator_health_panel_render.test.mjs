import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const creatorHealthPanelPath = path.resolve("app/(app)/app/_components/dashboard/CreatorHealthPanel.tsx");

test("creator health panel keeps hero score, trajectory line, and latest-report utility card", async () => {
  const source = await readFile(creatorHealthPanelPath, "utf8");

  assert.equal(source.includes("DashboardSectionHeader"), true);
  assert.equal(source.includes("Creator Health Score"), true);
  assert.equal(source.includes('data-testid="creator-health-trajectory"'), true);
  assert.equal(source.includes('data-testid="creator-health-panel"'), true);
  assert.equal(source.includes("Latest report"), true);
  assert.equal(source.includes("Open report"), true);
  assert.equal(source.includes("creatorHealth.stateLabel"), true);
  assert.equal(source.includes("Confidence note:"), true);
});
