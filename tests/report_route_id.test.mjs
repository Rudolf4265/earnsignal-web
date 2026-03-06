import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const routeIdModuleUrl = pathToFileURL(path.resolve("src/lib/report/route-id.ts")).href;

async function loadRouteIdModule(seed = Date.now()) {
  return import(`${routeIdModuleUrl}?t=${seed}`);
}

test("readReportRouteParamId resolves canonical [id] route param", async () => {
  const { readReportRouteParamId } = await loadRouteIdModule(Date.now() + 1);
  assert.equal(readReportRouteParamId({ id: "rep_123" }), "rep_123");
});

test("readReportRouteParamId rejects invalid values and stale reportId key usage", async () => {
  const { readReportRouteParamId } = await loadRouteIdModule(Date.now() + 2);

  assert.equal(readReportRouteParamId({}), null);
  assert.equal(readReportRouteParamId({ id: "" }), null);
  assert.equal(readReportRouteParamId({ id: "undefined" }), null);
  assert.equal(readReportRouteParamId({ reportId: "rep_wrong_key" }), null);
});

test("readReportRouteParamId supports array params but never returns undefined/null tokens", async () => {
  const { readReportRouteParamId } = await loadRouteIdModule(Date.now() + 3);

  assert.equal(readReportRouteParamId({ id: ["undefined", "rep_array"] }), "rep_array");
  assert.equal(readReportRouteParamId({ id: ["undefined", "null"] }), null);
});

