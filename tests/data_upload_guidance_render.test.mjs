import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const dataUploadPagePath = path.resolve("app/(app)/app/_components/upload/data-upload-page.tsx");
const trustMicrocopyPath = path.resolve("src/components/ui/trust-microcopy.tsx");
const uploadStepperPath = path.resolve("app/(app)/app/_components/upload/upload-stepper.tsx");

test("data upload page uses workspace staged-source truth alongside upload guidance", async () => {
  const [source, trustSource, uploadStepperSource] = await Promise.all([
    readFile(dataUploadPagePath, "utf8"),
    readFile(trustMicrocopyPath, "utf8"),
    readFile(uploadStepperPath, "utf8"),
  ]);

  assert.equal(source.includes('data-testid="data-upload-guide"'), true);
  assert.equal(source.includes("fetchWorkspaceDataSources"), true);
  assert.equal(source.includes("buildWorkspaceReportState"), true);
  assert.equal(source.includes("getUploadSupportMatrix()"), true);
  assert.equal(source.includes("buildVisibleUploadPlatformCardsFromSupportMatrix(supportMatrix)"), true);
  assert.equal(source.includes("refreshWorkspaceDataSources={refreshWorkspaceDataSources}"), true);
  assert.equal(source.includes('workspaceDataSources={workspaceDataSources}'), true);
  assert.equal(source.includes("Your report will combine all staged sources."), true);
  assert.equal(source.includes("Step-by-step file prep, supported format guidance, and troubleshooting in the upload guide."), true);
  assert.equal(source.includes("/app/help#upload-guide"), true);
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
