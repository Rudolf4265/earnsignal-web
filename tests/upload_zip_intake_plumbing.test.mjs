import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const uploadStepperPath = path.resolve("app/(app)/app/_components/upload/upload-stepper.tsx");

test("upload stepper inspects zip candidates before presign and keeps public CSV guidance unchanged", async () => {
  const source = await readFile(uploadStepperPath, "utf8");
  const zipCheckIndex = source.indexOf("isZipUploadCandidate(file)");
  const presignIndex = source.indexOf("createUploadPresign({");

  assert.equal(source.includes("inspectZipUploadFile"), true);
  assert.equal(source.includes("toZipUploadRejection"), true);
  assert.equal(source.includes('operation: "uploads.zip_intake"'), true);
  assert.equal(source.includes('nextStep: "file"'), true);
  assert.equal(zipCheckIndex >= 0, true);
  assert.equal(presignIndex >= 0, true);
  assert.equal(zipCheckIndex < presignIndex, true);
  assert.equal(source.includes("Accepted file type: CSV."), true);
  assert.equal(source.includes("This ZIP format is not yet importable. Upload a supported CSV instead."), true);
  assert.equal(source.includes("ZIP candidate matched"), false);
});
