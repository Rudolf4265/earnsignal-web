import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const dataUploadPagePath = path.resolve("app/(app)/app/_components/upload/data-upload-page.tsx");
const trustMicrocopyPath = path.resolve("src/components/ui/trust-microcopy.tsx");
const uploadStepperPath = path.resolve("app/(app)/app/_components/upload/upload-stepper.tsx");

test("data upload page keeps the main workspace simple while upload flow stays manifest-driven", async () => {
  const [source, trustSource, uploadStepperSource] = await Promise.all([
    readFile(dataUploadPagePath, "utf8"),
    readFile(trustMicrocopyPath, "utf8"),
    readFile(uploadStepperPath, "utf8"),
  ]);

  assert.equal(source.includes("DataPageHeader"), true);
  assert.equal(source.includes("ReadyToRunBanner"), true);
  assert.equal(source.includes("SourceListSection"), true);
  assert.equal(source.includes("HelpSection"), true);
  assert.equal(source.includes("DangerZoneClearData"), true);
  assert.equal(source.includes("fetchWorkspaceDataSources"), true);
  assert.equal(source.includes("buildWorkspaceReportState"), true);
  assert.equal(source.includes("getSourceManifest"), true);
  assert.equal(source.includes("normalizeSourceManifestResponse"), true);
  assert.equal(source.includes("buildUploadPlatformCardsFromManifest"), true);
  assert.equal(source.includes("source-manifest-unavailable"), true);
  assert.equal(source.includes("Manage details in Settings"), true);
  assert.equal(source.includes("Ready to run"), true);
  assert.equal(source.includes("View all reports"), true);
  assert.equal(source.includes("Your data sources"), true);
  assert.equal(source.includes("This report uses your staged sources."), true);
  assert.equal(source.includes("Contribution"), false);
  assert.equal(source.includes("Next run"), false);
  assert.equal(source.includes("report-driving"), false);
  assert.equal(source.includes("optional context"), false);
  assert.equal(source.includes("Accepted format:"), false);
  assert.equal(source.includes('testId="workspace-help-trust"'), true);
  assert.equal(source.includes("What this report is based on"), false);

  assert.equal(uploadStepperSource.includes("UploadFlowHeader"), true);
  assert.equal(uploadStepperSource.includes("UploadPlatformPicker"), true);
  assert.equal(uploadStepperSource.includes("UploadPrimaryFooterBar"), true);
  assert.equal(uploadStepperSource.includes("<TrustMicrocopy"), true);
  assert.equal(uploadStepperSource.includes('testId="upload-trust-strip"'), true);
  assert.equal(uploadStepperSource.includes("UPLOAD_TRUST_MICROCOPY_BODY"), true);
  assert.equal(
    trustSource.includes(
      'UPLOAD_TRUST_MICROCOPY_BODY =\n  "Files are used only to generate your reports and operate the service. Never sold. Never used to train public AI models."',
    ),
    true,
  );
});
