import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const reportsModuleUrl = pathToFileURL(path.resolve("src/lib/api/reports.ts")).href;

async function loadReportsModule(seed = Date.now()) {
  return import(`${reportsModuleUrl}?t=${seed}`);
}

test("fetchReportDetail rejects invalid report id before making a network request", async () => {
  const originalFetch = global.fetch;
  let fetchCalled = false;
  global.fetch = async () => {
    fetchCalled = true;
    throw new Error("network should not be called");
  };

  try {
    const { fetchReportDetail } = await loadReportsModule(Date.now() + 1);
    await assert.rejects(
      () => fetchReportDetail("undefined"),
      (error) => {
        assert.equal(error instanceof Error, true);
        assert.equal(error.message.includes("Report ID is unavailable"), true);
        return true;
      },
    );
    assert.equal(fetchCalled, false);
  } finally {
    global.fetch = originalFetch;
  }
});

test("fetchReportDetail rejects undefined/nullish ids before making a network request", async () => {
  const originalFetch = global.fetch;
  let fetchCalled = false;
  global.fetch = async () => {
    fetchCalled = true;
    throw new Error("network should not be called");
  };

  try {
    const { fetchReportDetail } = await loadReportsModule(Date.now() + 11);
    await assert.rejects(() => fetchReportDetail(undefined), /Report ID is unavailable/);
    await assert.rejects(() => fetchReportDetail(null), /Report ID is unavailable/);
    await assert.rejects(() => fetchReportDetail(""), /Report ID is unavailable/);
    assert.equal(fetchCalled, false);
  } finally {
    global.fetch = originalFetch;
  }
});

test("buildReportArtifactPdfUrl rejects invalid report id when artifact url is missing", async () => {
  process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test";
  const { buildReportArtifactPdfUrl } = await loadReportsModule(Date.now() + 2);

  assert.throws(
    () => buildReportArtifactPdfUrl({ reportId: "null", artifactUrl: null }),
    (error) => {
      assert.equal(error instanceof Error, true);
      assert.equal(error.message.includes("Report ID is unavailable"), true);
      return true;
    },
  );
});

test("getReportErrorMessage maps canonical ENTITLEMENT_REQUIRED to upgrade guidance", async () => {
  const clientModuleUrl = pathToFileURL(path.resolve("src/lib/api/client.ts")).href;
  const [{ ApiError }, { getReportErrorMessage }] = await Promise.all([
    import(`${clientModuleUrl}?t=${Date.now()}-api`),
    loadReportsModule(Date.now() + 3),
  ]);

  const error = new ApiError({
    status: 403,
    code: "ENTITLEMENT_REQUIRED",
    message: "Forbidden",
    operation: "report.artifact",
    path: "/v1/reports/rep_1/artifact",
    method: "GET",
    details: { access_reason_code: "ENTITLEMENT_REQUIRED", billing_required: true },
  });

  assert.equal(
    getReportErrorMessage(error),
    "This action requires Report or Pro access. Continue in Billing to upgrade or restore access.",
  );
});

test("createReportRun uses only the staged workspace run path and returns a canonical report id", async () => {
  const originalFetch = global.fetch;
  process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test";
  const requests = [];

  global.fetch = async (url, init = {}) => {
    requests.push({ url: String(url), method: init.method ?? "GET" });
    return {
      ok: true,
      status: 200,
      headers: { get: (key) => (key === "content-type" ? "application/json" : null) },
      text: async () => JSON.stringify({ report_id: "rep_run_123" }),
    };
  };

  try {
    const { createReportRun } = await loadReportsModule(Date.now() + 4);
    const result = await createReportRun();

    assert.deepEqual(requests, [{ url: "https://api.example.test/v1/reports/run", method: "POST" }]);
    assert.equal(result.reportId, "rep_run_123");
  } finally {
    global.fetch = originalFetch;
  }
});

test("createReportRun fails explicitly when /v1/reports/run is unavailable instead of falling back to /v1/reports", async () => {
  const originalFetch = global.fetch;
  process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test";
  const requests = [];

  global.fetch = async (url, init = {}) => {
    requests.push({ url: String(url), method: init.method ?? "GET" });
    return {
      ok: false,
      status: 404,
      headers: {
        get: (key) => {
          if (key === "content-type") return "application/json";
          return null;
        },
      },
      text: async () => JSON.stringify({ message: "missing", code: "NOT_FOUND" }),
    };
  };

  try {
    const { createReportRun } = await loadReportsModule(Date.now() + 5);
    await assert.rejects(() => createReportRun(), /missing/i);
    assert.deepEqual(requests, [{ url: "https://api.example.test/v1/reports/run", method: "POST" }]);
  } finally {
    global.fetch = originalFetch;
  }
});
