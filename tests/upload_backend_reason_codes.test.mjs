import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const uploadStepperPath = path.resolve("app/(app)/app/_components/upload/upload-stepper.tsx");

test("friendly error messages cover backend validation reason codes and keep copy platform-agnostic", async () => {
  const source = await readFile(uploadStepperPath, "utf8");

  assert.equal(source.includes('"invalid_upload_platform"'), true);
  assert.equal(source.includes('"schema_mismatch"'), true);
  assert.equal(source.includes('"recognized_not_implemented"'), true);
  assert.equal(source.includes('"unsupported_archive_shape"'), true);
  assert.equal(source.includes('"csv_validation_failed"'), true);

  assert.equal(
    source.includes("This file looks like a valid export, but not for the platform you selected. Choose the matching platform and try again."),
    true,
  );
  assert.equal(
    source.includes("This file does not match one of the supported input contracts for this platform."),
    true,
  );
  assert.equal(
    source.includes("This file was recognized, but one or more required fields are missing or invalid."),
    true,
  );
  assert.equal(source.includes("supported input contracts"), true);
  assert.equal(source.includes("reasonCode?.toLowerCase()"), true);
});

test("upload stepper surfaces canonical workspace guidance instead of frontend-owned support heuristics", async () => {
  const source = await readFile(uploadStepperPath, "utf8");

  assert.equal(source.includes("sourceManifest.eligibilityRule"), true);
  assert.equal(source.includes("sourceManifest.businessMetricsRule"), true);
  assert.equal(source.includes("selectedPlatformCard?.guidance"), true);
  assert.equal(source.includes("selectedPlatformCard?.roleSummary"), true);
  assert.equal(source.includes("workspaceBlockingReason"), true);
});
