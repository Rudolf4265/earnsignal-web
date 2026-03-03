import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const moduleUrl = pathToFileURL(path.resolve("src/lib/api/reports.ts")).href;

function createResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

test("listReports normalizes statuses and nullable fields", async () => {
  process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test";

  const calls = [];
  const originalFetch = global.fetch;
  global.fetch = async (input) => {
    calls.push(String(input));
    return createResponse({
      items: [
        { report_id: "rep1", created_at: "2026-01-01T00:00:00Z", status: "pending" },
        { report_id: "rep2", created_at: "2026-01-02T00:00:00Z", status: "processing" },
        { report_id: "rep3", created_at: "2026-01-03T00:00:00Z", status: "completed" },
        { report_id: "rep4", created_at: "2026-01-04T00:00:00Z", status: "error" },
      ],
      next_offset: 4,
      has_more: false,
    });
  };

  try {
    const { listReports } = await import(`${moduleUrl}?t=${Date.now()}`);
    const response = await listReports({ limit: 999, offset: -3 });

    assert.equal(calls.length, 1);
    assert.match(calls[0], /limit=100/);
    assert.match(calls[0], /offset=0/);
    assert.deepEqual(
      response.items.map((item) => item.status),
      ["queued", "running", "ready", "failed"],
    );
    assert.equal(response.items[0].artifact_url, null);
    assert.equal(response.items[0].title, null);
  } finally {
    global.fetch = originalFetch;
  }
});

test("listReports tolerates camelCase response aliases", async () => {
  process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test";

  const originalFetch = global.fetch;
  global.fetch = async () => {
    return createResponse({
      items: [
        {
          reportId: "rep_camel",
          createdAt: "2026-01-10T00:00:00Z",
          status: "ready",
          artifactUrl: "https://example.test/report.pdf",
          uploadId: "upl_camel",
          jobId: "job_camel",
          coverageStart: "2026-01-01",
          coverageEnd: "2026-01-09",
          platforms: ["youtube"],
        },
      ],
      nextOffset: 12,
      hasMore: true,
    });
  };

  try {
    const { listReports } = await import(`${moduleUrl}?t=${Date.now() + 1}`);
    const response = await listReports({ limit: 25, offset: 10 });

    assert.equal(response.next_offset, 12);
    assert.equal(response.has_more, true);
    assert.equal(response.items[0].report_id, "rep_camel");
    assert.equal(response.items[0].artifact_url, "https://example.test/report.pdf");
    assert.equal(response.items[0].coverage_start, "2026-01-01");
  } finally {
    global.fetch = originalFetch;
  }
});


test("listReports drops rows missing canonical report identifier", async () => {
  process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test";

  const originalFetch = global.fetch;
  global.fetch = async () =>
    createResponse({
      items: [
        { created_at: "2026-01-01T00:00:00Z", status: "ready" },
        { id: "rep_from_id", created_at: "2026-01-02T00:00:00Z", status: "ready" },
      ],
      next_offset: 2,
      has_more: false,
    });

  try {
    const { listReports } = await import(`${moduleUrl}?t=${Date.now() + 2}`);
    const response = await listReports();

    assert.equal(response.items.length, 1);
    assert.equal(response.items[0].report_id, "rep_from_id");
  } finally {
    global.fetch = originalFetch;
  }
});

test("getReport uses /v1/reports/:reportId", async () => {
  process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test";

  const calls = [];
  const originalFetch = global.fetch;
  global.fetch = async (input) => {
    calls.push(String(input));
    return createResponse({
      report_id: "r1",
      title: "Detail",
      status: "ready",
      summary: "ok",
    });
  };

  try {
    const { getReport } = await import(`${moduleUrl}?t=${Date.now() + 3}`);
    const response = await getReport("r1");

    assert.match(calls[0], /\/v1\/reports\/r1$/);
    assert.equal(response.id, "r1");
  } finally {
    global.fetch = originalFetch;
  }
});
