import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const revenueSnapshotSectionPath = path.resolve("app/(app)/app/_components/dashboard/RevenueSnapshotSection.tsx");

test("revenue snapshot renders only revenue and subscribers cards", async () => {
  const source = await readFile(revenueSnapshotSectionPath, "utf8");
  assert.equal(source.includes('label="Revenue"'), true);
  assert.equal(source.includes('label="Subscribers"'), true);
  assert.equal(source.includes("Stability Index"), false);
  assert.equal(source.includes("Churn Velocity"), false);
});

test("revenue snapshot keeps graceful fallback subtext when deltas are missing", async () => {
  const source = await readFile(revenueSnapshotSectionPath, "utf8");
  assert.equal(source.includes("No revenue comparison available yet."), true);
  assert.equal(source.includes("No subscriber comparison available yet."), true);
});
