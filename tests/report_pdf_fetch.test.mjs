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
    artifactUrl: null,
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

test("buildReportArtifactPdfUrl uses artifact_url when present", async () => {
  process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test";
  const { buildReportArtifactPdfUrl } = await import(`${reportsModuleUrl}?t=${Date.now()}`);
  const url = buildReportArtifactPdfUrl({ reportId: "rep_123", artifactUrl: "/v1/reports/rep_123/artifact" });

  assert.equal(url, "https://api.example.test/v1/reports/rep_123/artifact");
});

test("buildReportArtifactPdfUrl falls back to /v1/reports/:id/artifact when artifact_url is missing", async () => {
  process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test";
  const { buildReportArtifactPdfUrl } = await import(`${reportsModuleUrl}?t=${Date.now() + 1}`);
  const url = buildReportArtifactPdfUrl({ reportId: "rep_123", artifactUrl: null });

  assert.equal(url, "https://api.example.test/v1/reports/rep_123/artifact");
});

test("buildReportArtifactPdfUrl ignores invalid artifact_url report_id tokens", async () => {
  process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test";
  const { buildReportArtifactPdfUrl } = await import(`${reportsModuleUrl}?t=${Date.now() + 10}`);
  const url = buildReportArtifactPdfUrl({
    reportId: "rep_123",
    artifactUrl: "/v1/reports/undefined/artifact",
  });

  assert.equal(url, "https://api.example.test/v1/reports/rep_123/artifact");
});

test("buildReportArtifactPdfUrl ignores mismatched artifact_url report_id values", async () => {
  process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test";
  const { buildReportArtifactPdfUrl } = await import(`${reportsModuleUrl}?t=${Date.now() + 11}`);
  const url = buildReportArtifactPdfUrl({
    reportId: "rep_123",
    artifactUrl: "/v1/reports/rep_other/artifact",
  });

  assert.equal(url, "https://api.example.test/v1/reports/rep_123/artifact");
});

test("fetchReportPdfBlobUrl falls back to /v1/reports/:id/artifact when url is missing", async () => {
  const originalFetch = global.fetch;
  process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test";
  const requests = [];

  global.fetch = async (url, init = {}) => {
    requests.push({ url, init });
    return {
      ok: true,
      status: 200,
      headers: { get: (key) => (key === "content-type" ? "application/pdf" : null) },
      blob: async () => new Blob(["%PDF-1.4"], { type: "application/pdf" }),
    };
  };

  try {
    const { fetchReportPdfBlobUrl } = await import(`${reportsModuleUrl}?t=${Date.now() + 2}`);
    const pdfBlobUrl = await fetchReportPdfBlobUrl(createReport());
    assert.equal(typeof pdfBlobUrl, "string");
    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, "https://api.example.test/v1/reports/rep_123/artifact");
    assert.equal(requests[0].init.headers.Accept, "application/pdf");
    assert.equal(pdfBlobUrl.startsWith("blob:"), true);
    URL.revokeObjectURL(pdfBlobUrl);
  } finally {
    global.fetch = originalFetch;
  }
});

test("fetchReportPdfBlobUrl accepts octet-stream when content-disposition indicates a pdf filename", async () => {
  const originalFetch = global.fetch;
  process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test";

  global.fetch = async () => ({
    ok: true,
    status: 200,
    headers: {
      get: (key) => {
        if (key === "content-type") return "application/octet-stream";
        if (key === "content-disposition") return 'attachment; filename="rep_123.pdf"';
        return null;
      },
    },
    blob: async () => new Blob(["%PDF-1.4"], { type: "application/octet-stream" }),
  });

  try {
    const { fetchReportPdfBlobUrl } = await import(`${reportsModuleUrl}?t=${Date.now() + 4}`);
    const pdfBlobUrl = await fetchReportPdfBlobUrl(createReport({ artifactUrl: "/v1/reports/rep_123/artifact" }));
    assert.equal(pdfBlobUrl.startsWith("blob:"), true);
    URL.revokeObjectURL(pdfBlobUrl);
  } finally {
    global.fetch = originalFetch;
  }
});

test("fetchReportPdfBlobUrl rejects non-pdf content-type with status details", async () => {
  const originalFetch = global.fetch;
  process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test";

  global.fetch = async () => ({
    ok: true,
    status: 200,
    headers: { get: (key) => (key === "content-type" ? "text/html" : null) },
    blob: async () => new Blob(["<html>bad</html>"], { type: "text/html" }),
  });

  try {
    const { fetchReportPdfBlobUrl } = await import(`${reportsModuleUrl}?t=${Date.now() + 3}`);
    await assert.rejects(
      () => fetchReportPdfBlobUrl(createReport({ artifactUrl: "/v1/reports/rep_123/artifact" })),
      (error) => {
        assert.equal(error instanceof Error, true);
        assert.equal(error.message.includes("HTTP 200"), true);
        assert.equal(error.message.includes("content-type: text/html"), true);
        return true;
      },
    );
  } finally {
    global.fetch = originalFetch;
  }
});
