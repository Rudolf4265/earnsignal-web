import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const moduleUrl = pathToFileURL(path.resolve("src/lib/api/http.js")).href;

function mockResponse({ status = 200, contentType = "application/json", body = "" }) {
  return {
    status,
    headers: { get: () => contentType },
    text: async () => body,
  };
}

test("safeParseJsonResponse parses JSON payload", async () => {
  const { safeParseJsonResponse } = await import(`${moduleUrl}?t=${Date.now()}`);
  const parsed = await safeParseJsonResponse(mockResponse({ body: '{"ok":true}' }));
  assert.deepEqual(parsed, { ok: true });
});

test("safeParseJsonResponse rejects HTML payload", async () => {
  const { safeParseJsonResponse } = await import(`${moduleUrl}?t=${Date.now() + 1}`);
  await assert.rejects(
    safeParseJsonResponse(mockResponse({ contentType: "text/html", body: "<!DOCTYPE html><html></html>" })),
    /non-JSON response/,
  );
});

test("safeParseJsonResponse returns null for empty body", async () => {
  const { safeParseJsonResponse } = await import(`${moduleUrl}?t=${Date.now() + 2}`);
  const parsed = await safeParseJsonResponse(mockResponse({ body: "   " }));
  assert.equal(parsed, null);
});

test("safeParseJsonResponse returns null for 204", async () => {
  const { safeParseJsonResponse } = await import(`${moduleUrl}?t=${Date.now() + 3}`);
  const parsed = await safeParseJsonResponse(mockResponse({ status: 204, body: "" }));
  assert.equal(parsed, null);
});

test("fetchApiJson reports status when server returns 401 HTML", async () => {
  global.fetch = async () => ({
    status: 401,
    ok: false,
    headers: { get: () => "text/html" },
    text: async () => "<!DOCTYPE html><html><body>Unauthorized</body></html>",
  });

  const { fetchApiJson } = await import(`${moduleUrl}?t=${Date.now() + 4}`);

  await assert.rejects(fetchApiJson("/v1/entitlements", { method: "GET" }, "billing status"), /non-JSON response/);

  delete global.fetch;
});
