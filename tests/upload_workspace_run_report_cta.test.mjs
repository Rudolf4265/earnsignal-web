import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const dataUploadPagePath = path.resolve("app/(app)/app/_components/upload/data-upload-page.tsx");
const uploadStepperPath = path.resolve("app/(app)/app/_components/upload/upload-stepper.tsx");

test("staged sources panel derives Run Report availability from workspace staged-source truth", async () => {
  const source = await readFile(dataUploadPagePath, "utf8");

  assert.equal(source.includes("fetchWorkspaceDataSources"), true);
  assert.equal(source.includes("buildWorkspaceReportState"), true);
  assert.equal(source.includes("const [currentReportId, setCurrentReportId] = useState<string | null>(null);"), true);
  assert.equal(source.includes("const workspaceDataSourcesRef = useRef<WorkspaceDataSourcesResponse | null | \"loading\">(\"loading\");"), true);
  assert.equal(source.includes("currentReportId,"), true);
  assert.equal(source.includes("workspaceReportState.hasExistingReport"), true);
  assert.equal(source.includes('View Report'), true);
  assert.equal(source.includes("const preserveCurrent ="), true);
  assert.equal(source.includes("const showRunReportAction = workspaceReportState.canRunReport && !showViewReportAction;"), true);
  assert.equal(source.includes("Combine your staged sources into one report."), true);
  assert.equal(source.includes('data-testid="staged-run-report"'), true);
});

test("upload stepper uses workspaceReportState only for Run/View Report CTA gating", async () => {
  const source = await readFile(uploadStepperPath, "utf8");

  assert.equal(source.includes("const showWorkspaceViewReport ="), true);
  assert.equal(source.includes("workspaceReportState.hasExistingReport"), true);
  assert.equal(source.includes("const showWorkspaceRunReport ="), true);
  assert.equal(source.includes('processingStatus === "ready" && workspaceReportState.canRunReport'), false);
  assert.equal(source.includes('latestTerminalUpload?.status === "ready" && workspaceReportState.canRunReport'), false);
  assert.equal(source.includes("latestTerminalUpload.reportId"), false);
  assert.equal(source.includes("setReportId"), false);
  assert.equal(source.includes("Checking workspace..."), true);
  assert.equal(source.includes('data-testid="upload-run-report"'), true);
  assert.equal(source.includes('data-testid="upload-completed-run-report"'), true);
  assert.equal(source.includes('data-testid="upload-completed-view-report"'), true);
});
