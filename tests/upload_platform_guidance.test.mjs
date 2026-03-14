import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const moduleUrl = pathToFileURL(path.resolve("src/lib/upload/platform-guidance.ts")).href;

test("upload guidance reflects only currently supported guided revenue platforms", async () => {
  const { getSupportedRevenueUploadLabels, getSupportedRevenueUploadSummary } = await import(`${moduleUrl}?t=${Date.now()}`);

  assert.deepEqual(getSupportedRevenueUploadLabels(), ["Patreon", "Substack"]);
  assert.equal(getSupportedRevenueUploadSummary(), "Patreon and Substack CSV exports");
});
