import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const workspaceApiModuleUrl = pathToFileURL(path.resolve("src/lib/api/workspace.ts")).href;
const workspaceStateModuleUrl = pathToFileURL(path.resolve("src/lib/workspace/report-run-state.ts")).href;

test("workspace readiness normalization trusts canonical backend fields over legacy run_report_enabled", async () => {
  const [{ normalizeWorkspaceDataSourcesResponse }, { buildWorkspaceReportState }] = await Promise.all([
    import(`${workspaceApiModuleUrl}?t=${Date.now()}`),
    import(`${workspaceStateModuleUrl}?t=${Date.now() + 1}`),
  ]);

  const normalized = normalizeWorkspaceDataSourcesResponse({
    workspace_id: "creator-4",
    supported_source_count: 5,
    ready_source_count: 1,
    processing_source_count: 0,
    missing_source_count: 4,
    failed_source_count: 0,
    included_source_count: 1,
    run_report_enabled: true,
    eligible_for_report: false,
    blocking_reason: "Add at least one report-driving source to run a combined report.",
    report_has_business_metrics: false,
    report_readiness_note: "Supporting sources are staged, but the workspace is not report-ready yet.",
    report_driving_ready_source_count: 0,
    report_driving_included_source_count: 0,
    sources: [
      {
        platform: "instagram",
        label: "Instagram",
        descriptor: "Social performance",
        accepted_file_types_label: "Normalized CSV or exact allowlisted ZIP",
        report_role: "supporting",
        standalone_report_eligible: false,
        business_metrics_capable: false,
        role_summary: "Performance data only. Supports a combined report but cannot generate one alone.",
        state: "ready",
        included_in_next_report: true,
        last_upload_at: "2026-03-22T10:00:00Z",
        last_ready_at: "2026-03-22T10:00:00Z",
        status_message: "ready",
        action_label: "Replace",
      },
    ],
  });

  assert.equal(normalized.runReportEnabled, true);
  assert.equal(normalized.eligibleForReport, false);
  assert.equal(normalized.blockingReason, "Add at least one report-driving source to run a combined report.");
  assert.equal(normalized.reportReadinessNote, "Supporting sources are staged, but the workspace is not report-ready yet.");
  assert.equal(normalized.reportHasBusinessMetrics, false);

  const state = buildWorkspaceReportState(normalized, { isLoading: false, currentReportId: null });
  assert.equal(state.canRunReport, false);
  assert.equal(state.eligibleForReport, false);
  assert.equal(state.includedSources.map((source) => source.platform).join(","), "instagram");
});
