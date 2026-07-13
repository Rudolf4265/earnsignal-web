import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const uploadStepperPath = path.resolve("app/(app)/app/_components/upload/upload-stepper.tsx");

test("upload stepper inspects zip candidates before presign and derives zip support from accepted extensions", async () => {
  const source = await readFile(uploadStepperPath, "utf8");
  const zipCheckIndex = source.indexOf("isZipUploadCandidate(file)");
  const presignIndex = source.indexOf("createUploadPresign({");

  assert.equal(source.includes("inspectZipArchiveBuffer"), true);
  // 5c30a8d removed client-side ZIP extraction: native ZIPs pass through to the
  // backend raw, so the stepper must not import the retired extractors.
  assert.equal(source.includes("extractInstagramZipBufferToUploadArtifact"), false);
  assert.equal(source.includes("extractTiktokZipBufferToUploadArtifact"), false);
  assert.equal(source.includes('platform === "tiktok" && zipInspection.kind === "supported_shape_tiktok_native_zip"'), true);
  assert.equal(source.includes('platform === "instagram" && zipInspection.kind === "supported_shape_instagram_native_zip"'), true);
  assert.equal(source.includes('platform === "youtube" && zipInspection.kind === "supported_shape_youtube_studio_zip"'), true);
  assert.equal(source.includes("toZipUploadRejection"), true);
  assert.equal(source.includes('operation: "uploads.instagram_zip_extract"'), false);
  assert.equal(source.includes('operation: "uploads.tiktok_zip_extract"'), false);
  assert.equal(source.includes('operation: "uploads.zip_intake"'), true);
  assert.equal(source.includes('nextStep: "file"'), true);
  assert.equal(zipCheckIndex >= 0, true);
  assert.equal(presignIndex >= 0, true);
  assert.equal(zipCheckIndex < presignIndex, true);
  // aa081a7 (auto-detect upload flow) replaced the derived accept attribute with a
  // fixed csv/zip accept list; per-platform zip support still derives from
  // acceptedExtensions on the selected platform card.
  assert.equal(source.includes('accept=".csv,.zip,text/csv,application/zip"'), true);
  assert.equal(source.includes('selectedPlatformCard?.acceptedExtensions.includes(".zip") === true'), true);
  assert.equal(source.includes("selectedPlatformCard?.importMode"), false);
  assert.equal(source.includes("friendlyFailureMessage(params.reasonCode)"), true);
});
