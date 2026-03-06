import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const listModelModuleUrl = pathToFileURL(path.resolve("src/lib/report/list-model.ts")).href;

async function loadListModel(seed = Date.now()) {
  return import(`${listModelModuleUrl}?t=${seed}`);
}

test("report list prefers items over legacy reports without merging", async () => {
  const { normalizeReportsListResponse } = await loadListModel(Date.now() + 1);

  const page = normalizeReportsListResponse({
    items: [
      {
        report_id: "rep_from_items",
        status: "ready",
        created_at: "2026-03-01T18:00:00Z",
      },
    ],
    reports: [
      {
        report_id: "rep_from_reports",
        status: "failed",
        created_at: "2026-02-28T18:00:00Z",
      },
    ],
    has_more: false,
  });

  assert.equal(page.items.length, 1);
  assert.equal(page.items[0].reportId, "rep_from_items");
});

test("report list falls back to legacy reports when items is missing", async () => {
  const { normalizeReportsListResponse } = await loadListModel(Date.now() + 2);

  const page = normalizeReportsListResponse({
    reports: [
      {
        report_id: "rep_legacy",
        status: "processing",
        created_at: "2026-03-01T18:00:00Z",
        artifact_url: "/v1/reports/rep_legacy/artifact",
      },
    ],
    next_offset: 14,
    has_more: true,
  });

  assert.equal(page.items.length, 1);
  assert.equal(page.items[0].reportId, "rep_legacy");
  assert.equal(page.nextOffset, 14);
  assert.equal(page.hasMore, true);
});

test("report list does not fall back to legacy reports when items key is present but invalid", async () => {
  const { normalizeReportsListResponse } = await loadListModel(Date.now() + 8);

  const page = normalizeReportsListResponse({
    items: null,
    reports: [
      {
        report_id: "rep_legacy_should_be_ignored",
        status: "ready",
      },
    ],
    has_more: false,
  });

  assert.equal(page.items.length, 0);
});

test("report list row mapping formats created_at, status badge, and title fallback", async () => {
  const { normalizeReportsListResponse, toReportListRows } = await loadListModel(Date.now() + 3);

  const page = normalizeReportsListResponse({
    items: [
      {
        report_id: "rep_ready",
        status: "ready",
        created_at: "2026-03-01T18:00:00Z",
        artifact_url: "/v1/reports/rep_ready/artifact",
        title: null,
      },
      {
        report_id: "rep_failed",
        status: "validation_failed",
        created_at: "2026-03-02T18:00:00Z",
      },
    ],
    has_more: false,
  });

  const rows = toReportListRows(page.items);
  assert.equal(rows.length, 2);

  assert.equal(rows[0].title, "Report");
  assert.equal(rows[0].statusLabel, "Ready");
  assert.equal(rows[0].statusVariant, "good");
  assert.equal(rows[0].createdAtLabel, "Mar 01, 2026");
  assert.equal(rows[0].canDownload, true);

  assert.equal(rows[1].statusLabel, "Validation Failed");
  assert.equal(rows[1].statusVariant, "warn");
  assert.equal(rows[1].canDownload, false);
  assert.equal(rows[1].viewHref, "/app/report/rep_failed");
  assert.equal(rows[1].canView, true);
});

test("report list does not treat legacy id as canonical report_id", async () => {
  const { normalizeReportsListResponse, toReportListRows } = await loadListModel(Date.now() + 4);

  const page = normalizeReportsListResponse({
    items: [
      {
        id: "artifact_legacy_123",
        status: "ready",
        title: "Legacy Artifact",
        created_at: "2026-03-03T18:00:00Z",
        artifact_url: "/v1/reports/artifact_legacy_123/artifact",
      },
    ],
    has_more: false,
  });

  assert.equal(page.items.length, 1);
  assert.equal(page.items[0].reportId, null);
  const rows = toReportListRows(page.items);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].canView, false);
  assert.equal(rows[0].viewHref, null);
});

test("report list rejects sentinel report_id values", async () => {
  const { normalizeReportsListResponse, toReportListRows } = await loadListModel(Date.now() + 7);

  const page = normalizeReportsListResponse({
    items: [
      {
        report_id: "undefined",
        status: "ready",
        created_at: "2026-03-04T18:00:00Z",
      },
    ],
    has_more: false,
  });

  assert.equal(page.items.length, 1);
  assert.equal(page.items[0].reportId, null);
  const rows = toReportListRows(page.items);
  assert.equal(rows[0].canView, false);
  assert.equal(rows[0].viewHref, null);
});

test("hasReports extraction prefers items over legacy reports when items is present", async () => {
  const { computeHasReportsFromListResponse } = await loadListModel(Date.now() + 5);

  const hasReports = computeHasReportsFromListResponse({
    items: [],
    reports: [
      {
        report_id: "rep_legacy_only",
        status: "ready",
      },
    ],
  });

  assert.equal(hasReports, false);
});

test("hasReports extraction falls back to legacy reports when items is missing", async () => {
  const { computeHasReportsFromListResponse } = await loadListModel(Date.now() + 6);

  const hasReports = computeHasReportsFromListResponse({
    reports: [
      {
        report_id: "rep_legacy",
        status: "ready",
      },
    ],
  });

  assert.equal(hasReports, true);
});
