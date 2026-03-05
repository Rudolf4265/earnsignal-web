import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const reportsModuleUrl = pathToFileURL(path.resolve("src/lib/api/reports.ts")).href;

function createReport(overrides = {}) {
  return {
    id: "rep_123",
    title: "Report rep_123",
    status: "ready",
    summary: "Summary",
    pdfUrl: null,
    keySignals: [],
    recommendedActions: [],
    metrics: {
      netRevenue: null,
      subscribers: null,
      stabilityIndex: null,
      churnVelocity: null,
      coverageMonths: null,
      platformsConnected: null,
    },
    ...overrides,
  };
}

test("fetchReportPdfBlobUrl falls back to /v1/reports/:id/pdf when url is missing", async () => {
  const originalFetch = global.fetch;
  process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test";
  const requests = [];

  global.fetch = async (url, init = {}) => {
    requests.push({ url, init });
    return {
      ok: true,
      status: 200,
      headers: { get: () => null },
      blob: async () => new Blob(["%PDF-1.4"], { type: "application/pdf" }),
    };
  };

  try {
    const { fetchReportPdfBlobUrl } = await import(`${reportsModuleUrl}?t=${Date.now()}`);
    const objectUrl = await fetchReportPdfBlobUrl(createReport());
    assert.equal(typeof objectUrl, "string");
    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, "https://api.example.test/v1/reports/rep_123/pdf");
    assert.equal(requests[0].init.headers.Accept, "application/pdf");
    if (objectUrl.startsWith("blob:")) {
      URL.revokeObjectURL(objectUrl);
    }
  } finally {
    global.fetch = originalFetch;
  }
});

test("fetchReportPdfBlobUrl rejects non-pdf payloads", async () => {
  const originalFetch = global.fetch;
  process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test";

  global.fetch = async () => ({
    ok: true,
    status: 200,
    headers: { get: () => null },
    blob: async () => new Blob(["<html>bad</html>"], { type: "text/html" }),
  });

  try {
    const { fetchReportPdfBlobUrl } = await import(`${reportsModuleUrl}?t=${Date.now() + 1}`);
    await assert.rejects(
      () => fetchReportPdfBlobUrl(createReport({ pdfUrl: "/v1/reports/rep_123/pdf" })),
      (error) => {
        assert.equal(error instanceof Error, true);
        assert.equal(error.message.includes("Expected PDF content"), true);
        return true;
      },
    );
  } finally {
    global.fetch = originalFetch;
  }
});
