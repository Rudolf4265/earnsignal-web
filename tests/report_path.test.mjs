import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const reportPathModuleUrl = pathToFileURL(path.resolve("src/lib/report/path.ts")).href;

async function loadReportPathModule(seed = Date.now()) {
  return import(`${reportPathModuleUrl}?t=${seed}`);
}

test("buildReportDetailPath returns canonical report detail path", async () => {
  const { buildReportDetailPath } = await loadReportPathModule(Date.now() + 1);

  assert.equal(buildReportDetailPath("rep_123"), "/app/report/rep_123");
  assert.equal(buildReportDetailPath("  rep_abc  "), "/app/report/rep_abc");
});

test("buildReportDetailPath rejects invalid report id values", async () => {
  const { buildReportDetailPath } = await loadReportPathModule(Date.now() + 2);

  assert.equal(buildReportDetailPath(undefined), null);
  assert.equal(buildReportDetailPath(null), null);
  assert.equal(buildReportDetailPath(""), null);
  assert.equal(buildReportDetailPath("undefined"), null);
  assert.equal(buildReportDetailPath("null"), null);
});

test("buildReportDetailPathOrIndex falls back to reports index", async () => {
  const { buildReportDetailPathOrIndex } = await loadReportPathModule(Date.now() + 3);

  assert.equal(buildReportDetailPathOrIndex("rep_123"), "/app/report/rep_123");
  assert.equal(buildReportDetailPathOrIndex("undefined"), "/app/report");
});
