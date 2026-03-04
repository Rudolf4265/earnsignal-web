import test from "node:test";
import assert from "node:assert/strict";

import { getReportHref, isReportViewable } from "../src/lib/report/viewability";

function baseReport(overrides = {}) {
  return {
    report_id: "r-123",
    created_at: "2026-03-01T00:00:00.000Z",
    status: "ready",
    artifact_url: null,
    artifact_json_url: null,
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

test("viewability: getReportHref always prefers app route", () => {
  const report = baseReport({ artifact_url: "https://cdn.example.test/r-123.pdf" });

  assert.equal(getReportHref(report), "/app/report/r-123");
});

test("viewability: ready report without report_id is not viewable", () => {
  const report = baseReport({ report_id: null, artifact_url: "https://cdn.example.test/r-123.pdf" });

  assert.equal(getReportHref(report), null);
  assert.equal(isReportViewable(report), false);
});

test("viewability: non-ready report is not viewable even with report_id", () => {
  const report = baseReport({ status: "running" });

  assert.equal(getReportHref(report), "/app/report/r-123");
  assert.equal(isReportViewable(report), false);
});
