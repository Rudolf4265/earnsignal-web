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
  assert.equal(source.includes("WorkspaceActionHero"), true);
  assert.equal(source.includes("WorkspaceChecklist"), true);
  assert.equal(source.includes("WorkspaceSourceDrawer"), true);
  assert.equal(source.includes("WorkspaceHelpFooter"), true);
  assert.equal(source.includes("Your workspace is ready"), true);
  assert.equal(source.includes("Build your report"), true);
  assert.equal(source.includes("Your data sources"), true);
  assert.equal(source.includes("Stage creator data, then run one combined decision-ready report from the current workspace snapshot."), true);
  assert.equal(source.includes('testId="workspace-help-trust"'), true);
  assert.equal(source.includes("Report readiness"), false);
  assert.equal(source.includes("What this report is based on"), false);
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
