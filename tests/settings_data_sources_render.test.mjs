import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const settingsPagePath = path.resolve("app/(app)/app/settings/page.tsx");

test("settings page exposes advanced data-source details and include-in-run controls", async () => {
  const source = await readFile(settingsPagePath, "utf8");

  assert.equal(source.includes("AdvancedDataSourcesPanel"), true);
  assert.equal(source.includes("buildAdvancedSourceDetails"), true);
  assert.equal(source.includes("updateSourceSelection"), true);
  assert.equal(source.includes("Data Sources"), true);
  assert.equal(source.includes("Advanced source details"), true);
  assert.equal(source.includes("Included in next run"), true);
  assert.equal(source.includes("Report-driving"), true);
  assert.equal(source.includes("Optional context"), true);
  assert.equal(source.includes("Exact format help"), true);
});
