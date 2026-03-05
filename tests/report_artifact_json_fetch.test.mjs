import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const reportsModuleUrl = pathToFileURL(path.resolve("src/lib/api/reports.ts")).href;

test("fetchReportArtifactJson prefixes relative URLs with NEXT_PUBLIC_API_BASE_URL", async () => {
  const originalFetch = global.fetch;
  process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test";

  let requestedUrl = "";
  global.fetch = async (url) => {
    requestedUrl = String(url);
    return {
      ok: true,
      status: 200,
      headers: {
        get: (key) => (key === "content-type" ? "application/json" : null),
      },
      text: async () => JSON.stringify({ report_id: "rep_123" }),
    };
  };

  try {
    const { fetchReportArtifactJson } = await import(`${reportsModuleUrl}?t=${Date.now()}`);
    const payload = await fetchReportArtifactJson("/v1/reports/rep_123/artifact.json");

    assert.equal(requestedUrl, "https://api.example.test/v1/reports/rep_123/artifact.json");
    assert.deepEqual(payload, { report_id: "rep_123" });
  } finally {
    global.fetch = originalFetch;
  }
});
