import test from "node:test";
import assert from "node:assert/strict";

import { getReportHref, isReportViewable } from "../src/lib/report/viewability";

function baseReport(overrides = {}) {
  return {
    report_id: "r-123",
    created_at: "2026-03-01T00:00:00.000Z",
    status: "ready",
    artifact_url: null,
    artifact_kind: null,
    upload_id: null,
    job_id: null,
    title: "Report",
    platforms: null,
    coverage_start: null,
    coverage_end: null,
    ...overrides,
  };
}

test("viewability: ready report with report_id and null artifact_url remains viewable", () => {
  const report = baseReport({ artifact_url: null });

  assert.equal(getReportHref(report), "/app/report/r-123");
  assert.equal(isReportViewable(report), true);
});

test("viewability: ready report with missing report_id but artifact_url is viewable", () => {
  const report = baseReport({ report_id: null, artifact_url: "https://cdn.example.test/r-123.pdf" });

  assert.equal(getReportHref(report), "https://cdn.example.test/r-123.pdf");
  assert.equal(isReportViewable(report), true);
});

test("viewability: non-ready report is not viewable even if href exists", () => {
  const report = baseReport({ status: "running", artifact_url: "https://cdn.example.test/r-123.pdf" });

  assert.equal(getReportHref(report), "https://cdn.example.test/r-123.pdf");
  assert.equal(isReportViewable(report), false);
});
