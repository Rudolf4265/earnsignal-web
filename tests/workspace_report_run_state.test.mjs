import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const moduleUrl = pathToFileURL(path.resolve("src/lib/workspace/report-run-state.ts")).href;

async function loadModule(seed = Date.now()) {
  return import(`${moduleUrl}?t=${seed}`);
}

test("workspace report state trusts canonical backend eligibility and readiness copy", async () => {
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
      eligibleForReport: true,
      blockingReason: null,
      reportHasBusinessMetrics: true,
      reportReadinessNote: "Ready to run a combined report from your staged sources.",
      reportDrivingReadySourceCount: 1,
      reportDrivingIncludedSourceCount: 1,
      sources: [
        {
          platform: "patreon",
          label: "Patreon",
          descriptor: "Membership revenue",
          acceptedFileTypesLabel: "Normalized CSV only",
          reportRole: "report_driving",
          standaloneReportEligible: true,
          businessMetricsCapable: true,
          roleSummary: "Revenue and subscriber data. Can generate a report on its own.",
          state: "ready",
          includedInNextReport: true,
          lastUploadAt: "2026-03-20T10:00:00Z",
          lastReadyAt: "2026-03-20T10:00:00Z",
          statusMessage: "ready",
          actionLabel: "Replace",
        },
        {
          platform: "instagram",
          label: "Instagram Performance",
          descriptor: "Social performance",
          acceptedFileTypesLabel: "CSV or allowlisted ZIP",
          reportRole: "supporting",
          standaloneReportEligible: false,
          businessMetricsCapable: false,
          roleSummary: "Performance data only. Supports a combined report but cannot generate one alone.",
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

  assert.equal(result.canRunReport, true);
  assert.equal(result.eligibleForReport, true);
  assert.equal(result.blockingReason, null);
  assert.equal(result.reportReadinessNote, "Ready to run a combined report from your staged sources.");
  assert.equal(result.reportHasBusinessMetrics, true);
  assert.equal(result.reportDrivingSourcesReadyCount, 1);
  assert.equal(result.reportDrivingIncludedSourceCount, 1);
  assert.deepEqual(
    result.includedSources.map((source) => source.platform),
    ["patreon", "instagram"],
  );
});

test("workspace report state keeps Run Report disabled when backend says the workspace is not eligible", async () => {
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
      runReportEnabled: false,
      eligibleForReport: false,
      blockingReason: "Add at least one revenue or subscriber data source (Patreon, Substack, or YouTube).",
      reportHasBusinessMetrics: false,
      reportReadinessNote: "Supporting sources add context but cannot generate a report alone.",
      reportDrivingReadySourceCount: 0,
      reportDrivingIncludedSourceCount: 0,
      sources: [
        {
          platform: "instagram",
          label: "Instagram Performance",
          descriptor: "Social performance",
          acceptedFileTypesLabel: "CSV or allowlisted ZIP",
          reportRole: "supporting",
          standaloneReportEligible: false,
          businessMetricsCapable: false,
          roleSummary: "Performance data only. Supports a combined report but cannot generate one alone.",
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

  assert.equal(result.canRunReport, false);
  assert.equal(result.eligibleForReport, false);
  assert.equal(
    result.blockingReason,
    "Add at least one revenue or subscriber data source (Patreon, Substack, or YouTube).",
  );
  assert.equal(result.reportHasBusinessMetrics, false);
  assert.equal(result.reportDrivingSourcesReadyCount, 0);
});

test("workspace report state keeps legacy runReportEnabled only as a compatibility fallback", async () => {
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
          platform: "youtube",
          label: "YouTube",
          descriptor: "Creator earnings",
          acceptedFileTypesLabel: "CSV or allowlisted ZIP",
          reportRole: "report_driving",
          standaloneReportEligible: true,
          businessMetricsCapable: true,
          roleSummary: "Can generate a report. Revenue and subscriber depth depends on the YouTube file you upload.",
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

  assert.equal(result.canRunReport, true);
  assert.equal(result.eligibleForReport, true);
  assert.equal(result.hasExistingReport, true);
  assert.equal(result.currentReportId, "rep_current_123");
});
