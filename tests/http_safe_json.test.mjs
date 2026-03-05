import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const moduleUrl = pathToFileURL(path.resolve("src/lib/api/client.ts")).href;

test("apiFetchJson normalizes API errors and captures request id", async () => {
  const originalFetch = global.fetch;
  process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test";

  global.fetch = async () => ({
    ok: false,
    status: 404,
    headers: {
      get: (key) => {
        if (key === "content-type") return "application/json";
        if (key === "x-request-id") return "req_123";
        return null;
      },
    },
    text: async () => JSON.stringify({ message: "missing", code: "NOT_FOUND", details: { id: "a1" } }),
  });

  try {
    const { apiFetchJson, ApiError } = await import(`${moduleUrl}?t=${Date.now()}`);

    await assert.rejects(
      () => apiFetchJson("entitlements.fetch", "/v1/entitlements", { method: "GET" }),
      (error) => {
        assert.equal(error instanceof ApiError, true);
        assert.equal(error.status, 404);
        assert.equal(error.code, "NOT_FOUND");
        assert.equal(error.requestId, "req_123");
        assert.equal(error.operation, "entitlements.fetch");
        assert.equal(error.path, "/v1/entitlements");
        assert.equal(error.method, "GET");
        return true;
      },
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test("apiFetchJson returns timeout ApiError", async () => {
  const originalFetch = global.fetch;
  process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test";

  global.fetch = async (_url, init = {}) => {
    await new Promise((_resolve, reject) => {
      init.signal?.addEventListener("abort", () => reject(new Error("aborted")));
    });
    return { ok: true, status: 200, headers: { get: () => "application/json" }, text: async () => "{}" };
  };

  try {
    const { apiFetchJson, ApiError } = await import(`${moduleUrl}?t=${Date.now() + 1}`);

    await assert.rejects(
      () => apiFetchJson("reports.fetch", "/v1/reports", { method: "GET", timeoutMs: 5 }),
      (error) => {
        assert.equal(error instanceof ApiError, true);
        assert.equal(error.code, "TIMEOUT");
        assert.equal(error.status, 0);
        return true;
      },
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test("apiFetchJson normalizes envelope success payloads with nested details", async () => {
  const originalFetch = global.fetch;
  process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test";

  global.fetch = async () => ({
    ok: true,
    status: 200,
    headers: {
      get: (key) => {
        if (key === "content-type") return "application/json";
        return null;
      },
    },
    text: async () =>
      JSON.stringify({
        status: "ok",
        code: "OK",
        message: "done",
        details: {
          upload_id: "upl_123",
          report_id: "rep_123",
        },
      }),
  });

  try {
    const { apiFetchJson } = await import(`${moduleUrl}?t=${Date.now() + 2}`);
    const payload = await apiFetchJson("uploads.latestStatus", "/v1/uploads/latest/status", { method: "GET" });
    assert.equal(payload.upload_id, "upl_123");
    assert.equal(payload.report_id, "rep_123");
  } finally {
    global.fetch = originalFetch;
  }
});
