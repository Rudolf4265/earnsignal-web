import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const reportIdModuleUrl = pathToFileURL(path.resolve("src/lib/report/id.ts")).href;

async function loadModule(seed = Date.now()) {
  return import(`${reportIdModuleUrl}?t=${seed}`);
}

test("normalizeReportId accepts non-empty ids", async () => {
  const { normalizeReportId } = await loadModule(Date.now() + 1);
  assert.equal(normalizeReportId("rep_123"), "rep_123");
  assert.equal(normalizeReportId("  rep_abc  "), "rep_abc");
});

test("normalizeReportId rejects empty and sentinel values", async () => {
  const { normalizeReportId } = await loadModule(Date.now() + 2);
  assert.equal(normalizeReportId(""), null);
  assert.equal(normalizeReportId("   "), null);
  assert.equal(normalizeReportId("undefined"), null);
  assert.equal(normalizeReportId("NULL"), null);
  assert.equal(normalizeReportId("NaN"), null);
  assert.equal(normalizeReportId(undefined), null);
  assert.equal(normalizeReportId(null), null);
});
