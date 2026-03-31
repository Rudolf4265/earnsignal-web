import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const dashboardHeaderPath = path.resolve("app/(app)/app/_components/dashboard/DashboardHeader.tsx");

test("dashboard header supports Pro badge and continuity treatment without changing shell controls", async () => {
  const source = await readFile(dashboardHeaderPath, "utf8");

  assert.equal(source.includes("planBadgeLabel?: string | null;"), true);
  assert.equal(source.includes('data-testid="dashboard-pro-badge"'), true);
  assert.equal(source.includes('tierBanner?: {'), true);
  assert.equal(source.includes('variant: "snapshot" | "pro";'), true);
  assert.equal(source.includes('data-testid={tierBanner.testId}'), true);
  assert.equal(source.includes('tierBanner.variant === "pro"'), true);
  assert.equal(source.includes("View reports"), true);
  assert.equal(source.includes("Refresh"), true);
});

test("dashboard header keeps a single compact banner slot for Report snapshot framing", async () => {
  const source = await readFile(dashboardHeaderPath, "utf8");

  assert.equal(source.includes("Track your latest report snapshot without digging through raw reporting detail."), true);
  assert.equal(source.includes("tierBanner.eyebrow"), true);
  assert.equal(source.includes("tierBanner.body"), true);
  assert.equal(source.includes('variant: "snapshot" | "pro";'), true);
});
