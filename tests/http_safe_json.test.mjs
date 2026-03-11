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

test("apiFetchJson valid JSON does not include non-json marker fields", async () => {
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
    text: async () => JSON.stringify({ ok: true, nested: { value: 1 } }),
  });

  try {
    const { apiFetchJson } = await import(`${moduleUrl}?t=${Date.now() + 3}`);
    const payload = await apiFetchJson("reports.fetch", "/v1/reports/rep_123", { method: "GET" });

    assert.deepEqual(payload, { ok: true, nested: { value: 1 } });
    assert.equal(Object.prototype.hasOwnProperty.call(payload, "__nonJsonText"), false);
    assert.equal(Object.prototype.hasOwnProperty.call(payload, "__invalidJsonText"), false);
    assert.equal(Object.prototype.hasOwnProperty.call(payload, "__responseContentType"), false);
  } finally {
    global.fetch = originalFetch;
  }
});

test("apiFetchJson blocks invalid report detail paths before network request", async () => {
  const originalFetch = global.fetch;
  process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test";
  let fetchCalled = false;

  global.fetch = async () => {
    fetchCalled = true;
    throw new Error("network should not be called");
  };

  try {
    const { apiFetchJson, ApiError } = await import(`${moduleUrl}?t=${Date.now() + 4}`);
    await assert.rejects(
      () => apiFetchJson("report.fetch", "/v1/reports/undefined", { method: "GET" }),
      (error) => {
        assert.equal(error instanceof ApiError, true);
        assert.equal(error.code, "INVALID_REPORT_ID");
        assert.equal(error.status, 0);
        return true;
      },
    );
    assert.equal(fetchCalled, false);
  } finally {
    global.fetch = originalFetch;
  }
});

test("isEntitlementRequiredError recognizes canonical entitlement denial semantics", async () => {
  const { ApiError, isEntitlementRequiredError } = await import(`${moduleUrl}?t=${Date.now() + 5}`);

  const explicitCode = new ApiError({
    status: 403,
    code: "ENTITLEMENT_REQUIRED",
    message: "upgrade required",
    operation: "reports.list",
    path: "/v1/reports",
    method: "GET",
  });
  assert.equal(isEntitlementRequiredError(explicitCode), true);

  const nestedReason = new ApiError({
    status: 403,
    code: "FORBIDDEN",
    message: "forbidden",
    operation: "report.artifact",
    path: "/v1/reports/rep_1/artifact",
    method: "GET",
    details: { access_reason_code: "ENTITLEMENT_REQUIRED", billing_required: true },
  });
  assert.equal(isEntitlementRequiredError(nestedReason), true);

  const nonEntitlement = new ApiError({
    status: 403,
    code: "FORBIDDEN",
    message: "forbidden",
    operation: "report.fetch",
    path: "/v1/reports/rep_1",
    method: "GET",
  });
  assert.equal(isEntitlementRequiredError(nonEntitlement), false);
});
