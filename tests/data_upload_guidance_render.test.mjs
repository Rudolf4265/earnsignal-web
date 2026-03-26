import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const dataUploadPagePath = path.resolve("app/(app)/app/_components/upload/data-upload-page.tsx");
const trustMicrocopyPath = path.resolve("src/components/ui/trust-microcopy.tsx");
const uploadStepperPath = path.resolve("app/(app)/app/_components/upload/upload-stepper.tsx");

test("data upload page consumes canonical source manifest and workspace readiness truth", async () => {
  const [source, trustSource, uploadStepperSource] = await Promise.all([
    readFile(dataUploadPagePath, "utf8"),
    readFile(trustMicrocopyPath, "utf8"),
    readFile(uploadStepperPath, "utf8"),
  ]);

  assert.equal(source.includes('data-testid="data-upload-guide"'), true);
  assert.equal(source.includes("fetchWorkspaceDataSources"), true);
  assert.equal(source.includes("buildWorkspaceReportState"), true);
  assert.equal(source.includes("getSourceManifest"), true);
  assert.equal(source.includes("normalizeSourceManifestResponse"), true);
  assert.equal(source.includes("buildUploadPlatformCardsFromManifest"), true);
  assert.equal(source.includes("source-manifest-unavailable"), true);
  assert.equal(source.includes("getFallbackSourceManifest"), false);
  assert.equal(source.includes("Report readiness"), true);
  assert.equal(source.includes("What this report is based on"), true);
  assert.equal(source.includes("Generate one combined report from the staged workspace."), true);
  assert.equal(source.includes("Stage real creator data sources, then generate one combined decision-ready report."), true);
  assert.equal(source.includes("Reports are generated from the workspace snapshot you choose to run."), true);
  assert.equal(source.includes("getUploadSupportMatrix()"), false);
  assert.equal(source.includes("supportMatrix"), false);

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
