import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const uploadStepperPath = path.resolve("app/(app)/app/_components/upload/upload-stepper.tsx");

test("upload failure UI uses a single calmer error surface with secondary diagnostics", async () => {
  const source = await readFile(uploadStepperPath, "utf8");

  assert.equal(source.includes("buildUploadErrorPresentation"), true);
  assert.equal(source.includes('title: "Upload issue"'), true);
  assert.equal(source.includes('title: "File mismatch"'), true);
  assert.equal(source.includes('fallbackMessage ?? "We could not complete your upload. Please retry."'), true);
  assert.equal(source.includes('message: "This file does not match the selected source. Choose the matching source and retry."'), true);
  assert.equal(source.includes("{!error ? ("), true);
  assert.equal(source.includes("Reason code:"), false);
  assert.equal(source.includes("Operation:"), false);
  assert.equal(source.includes("requestId={errorRequestId ?? undefined}"), false);
  assert.equal(source.includes('data-testid="upload-copy-diagnostics"'), true);
  assert.equal(source.includes('data-testid="upload-retry"'), true);
  assert.equal(source.includes('data-testid="upload-reset"'), true);
});
