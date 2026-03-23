import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const moduleUrl = pathToFileURL(path.resolve("src/lib/workspace/report-run-state.ts")).href;

async function loadModule(seed = Date.now()) {
  return import(`${moduleUrl}?t=${seed}`);
}

test("workspace report state enables Run Report only when a report-driving staged source is ready and included", async () => {
  const { buildWorkspaceReportState } = await loadModule(Date.now() + 1);

  const result = buildWorkspaceReportState(
    {
      workspaceId: "creator-1",
      supportedSourceCount: 5,
      readySourceCount: 2,
      processingSourceCount: 0,
      missingSourceCount: 3,
      failedSourceCount: 0,
      includedSourceCount: 2,
      runReportEnabled: true,
      reportDrivingReadySourceCount: null,
      reportDrivingIncludedSourceCount: null,
      sources: [
        {
          platform: "patreon",
          label: "Patreon",
          descriptor: "Membership revenue",
          acceptedFileTypesLabel: "CSV only",
          state: "ready",
          includedInNextReport: true,
          lastUploadAt: "2026-03-20T10:00:00Z",
          lastReadyAt: "2026-03-20T10:00:00Z",
          statusMessage: "ready",
          actionLabel: "Replace",
        },
        {
          platform: "instagram",
          label: "Instagram",
          descriptor: "Performance",
          acceptedFileTypesLabel: "Allowlisted ZIP",
          state: "ready",
          includedInNextReport: true,
          lastUploadAt: "2026-03-21T10:00:00Z",
          lastReadyAt: "2026-03-21T10:00:00Z",
          statusMessage: "ready",
          actionLabel: "Replace",
        },
      ],
    },
    { isLoading: false, currentReportId: null },
  );

  assert.equal(result.stagedSourcesReadyCount, 2);
  assert.equal(result.reportDrivingSourcesReadyCount, 1);
  assert.equal(result.reportDrivingIncludedSourceCount, 1);
  assert.equal(result.canRunReport, true);
  assert.equal(result.hasExistingReport, false);
  assert.equal(result.isLoading, false);
  assert.equal(result.mostRecentSource?.platform, "instagram");
});

test("workspace report state does not enable Run Report for performance-only staged sources", async () => {
  const { buildWorkspaceReportState } = await loadModule(Date.now() + 2);

  const result = buildWorkspaceReportState(
    {
      workspaceId: "creator-2",
      supportedSourceCount: 5,
      readySourceCount: 1,
      processingSourceCount: 0,
      missingSourceCount: 4,
      failedSourceCount: 0,
      includedSourceCount: 1,
      runReportEnabled: true,
      reportDrivingReadySourceCount: null,
      reportDrivingIncludedSourceCount: null,
      sources: [
        {
          platform: "instagram",
          label: "Instagram",
          descriptor: "Performance",
          acceptedFileTypesLabel: "Allowlisted ZIP",
          state: "ready",
          includedInNextReport: true,
          lastUploadAt: "2026-03-22T10:00:00Z",
          lastReadyAt: "2026-03-22T10:00:00Z",
          statusMessage: "ready",
          actionLabel: "Replace",
        },
      ],
    },
    { isLoading: false, currentReportId: null },
  );

  assert.equal(result.reportDrivingSourcesReadyCount, 0);
  assert.equal(result.reportDrivingIncludedSourceCount, 0);
  assert.equal(result.canRunReport, false);
});

test("workspace report state trusts backend included counts when a prior ready report-driving source remains runnable", async () => {
  const { buildWorkspaceReportState } = await loadModule(Date.now() + 3);

  const result = buildWorkspaceReportState(
    {
      workspaceId: "creator-3",
      supportedSourceCount: 5,
      readySourceCount: 0,
      processingSourceCount: 1,
      missingSourceCount: 4,
      failedSourceCount: 0,
      includedSourceCount: 1,
      runReportEnabled: true,
      reportDrivingReadySourceCount: 0,
      reportDrivingIncludedSourceCount: 1,
      sources: [
        {
          platform: "patreon",
          label: "Patreon",
          descriptor: "Membership revenue",
          acceptedFileTypesLabel: "CSV only",
          state: "processing",
          includedInNextReport: true,
          lastUploadAt: "2026-03-23T10:00:00Z",
          lastReadyAt: "2026-03-20T10:00:00Z",
          statusMessage: "previous staged data remains available",
          actionLabel: "View status",
        },
      ],
    },
    { isLoading: false, currentReportId: "rep_current_123" },
  );

  assert.equal(result.reportDrivingSourcesReadyCount, 0);
  assert.equal(result.reportDrivingIncludedSourceCount, 1);
  assert.equal(result.canRunReport, true);
  assert.equal(result.hasExistingReport, true);
  assert.equal(result.currentReportId, "rep_current_123");
});
