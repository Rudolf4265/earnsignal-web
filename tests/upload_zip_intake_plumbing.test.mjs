import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const uploadStepperPath = path.resolve("app/(app)/app/_components/upload/upload-stepper.tsx");

test("upload stepper inspects zip candidates before presign and only continues for bounded instagram zip support", async () => {
  const source = await readFile(uploadStepperPath, "utf8");
  const zipCheckIndex = source.indexOf("isZipUploadCandidate(file)");
  const presignIndex = source.indexOf("createUploadPresign({");

  assert.equal(source.includes("inspectZipArchiveBuffer"), true);
  assert.equal(source.includes("extractInstagramZipBufferToUploadArtifact"), true);
  assert.equal(source.includes('platform === "instagram" && zipInspection.kind === "supported_shape_instagram_candidate"'), true);
  assert.equal(source.includes("toZipUploadRejection"), true);
  assert.equal(source.includes('operation: "uploads.instagram_zip_extract"'), true);
  assert.equal(source.includes('operation: "uploads.zip_intake"'), true);
  assert.equal(source.includes('nextStep: "file"'), true);
  assert.equal(zipCheckIndex >= 0, true);
  assert.equal(presignIndex >= 0, true);
  assert.equal(zipCheckIndex < presignIndex, true);
  assert.equal(source.includes("Accepted file type: CSV."), true);
  assert.equal(source.includes('accept={fileInputAccept}'), true);
  assert.equal(source.includes('selectedPlatformCard?.id === "instagram"'), true);
  assert.equal(source.includes("Selected supported Instagram ZIP exports are also accepted."), true);
  assert.equal(source.includes("This ZIP format is not yet importable. Upload a supported CSV instead."), true);
  assert.equal(source.includes("ZIP candidate matched"), false);
  assert.equal(source.includes("Instagram ZIP candidate"), false);
  assert.equal(source.includes("TikTok ZIP candidate"), false);
});
