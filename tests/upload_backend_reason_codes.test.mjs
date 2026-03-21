import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const uploadStepperPath = path.resolve("app/(app)/app/_components/upload/upload-stepper.tsx");

test("friendly error messages cover all backend validation reason codes", async () => {
  const source = await readFile(uploadStepperPath, "utf8");

  // Backend reason codes must map to user-friendly messages
  assert.equal(
    source.includes('"invalid_upload_platform"'),
    true,
    "INVALID_UPLOAD_PLATFORM handler present",
  );
  assert.equal(
    source.includes('"schema_mismatch"'),
    true,
    "SCHEMA_MISMATCH handler present",
  );
  assert.equal(
    source.includes('"recognized_not_implemented"'),
    true,
    "RECOGNIZED_NOT_IMPLEMENTED handler present",
  );
  assert.equal(
    source.includes('"unsupported_archive_shape"'),
    true,
    "UNSUPPORTED_ARCHIVE_SHAPE handler present",
  );
  assert.equal(
    source.includes('"csv_validation_failed"'),
    true,
    "CSV_VALIDATION_FAILED handler present",
  );

  // User-facing messages must be friendly and actionable
  assert.equal(
    source.includes("This file looks like a valid export, but not for the platform you selected. Choose the matching platform and try again."),
    true,
    "INVALID_UPLOAD_PLATFORM friendly message present",
  );
  assert.equal(
    source.includes("This file doesn't match one of the supported import formats for this platform."),
    true,
    "SCHEMA_MISMATCH friendly message present",
  );
  assert.equal(
    source.includes("We recognized this export type, but it isn't supported yet in EarnSigma."),
    true,
    "RECOGNIZED_NOT_IMPLEMENTED friendly message present",
  );
  assert.equal(
    source.includes("This ZIP export isn't in one of the currently supported formats for this platform."),
    true,
    "UNSUPPORTED_ARCHIVE_SHAPE friendly message present",
  );
  assert.equal(
    source.includes("This file was recognized, but one or more required fields are missing or invalid."),
    true,
    "CSV_VALIDATION_FAILED friendly message present",
  );

  // Stale "upload a supported CSV instead" language must not be the only recovery path
  assert.equal(source.includes("Upload a supported CSV instead"), false, "no stale 'Upload a supported CSV instead' message");

  // Raw backend codes must not be surfaced as-is to users in primary messages
  assert.equal(source.includes("INVALID_UPLOAD_PLATFORM"), false, "raw uppercase code not in primary UI");
  assert.equal(source.includes("SCHEMA_MISMATCH"), false, "raw uppercase code not in primary UI");
  assert.equal(source.includes("RECOGNIZED_NOT_IMPLEMENTED"), false, "raw uppercase code not in primary UI");
  assert.equal(source.includes("CSV_VALIDATION_FAILED"), false, "raw uppercase code not in primary UI");
});

test("reason code normalization handles uppercase backend codes gracefully", async () => {
  const source = await readFile(uploadStepperPath, "utf8");

  // The normalizedCode path handles case conversion
  assert.equal(source.includes("normalizedCode === \"invalid_upload_platform\""), true);
  assert.equal(source.includes("normalizedCode === \"schema_mismatch\""), true);
  assert.equal(source.includes("normalizedCode === \"recognized_not_implemented\""), true);
  assert.equal(source.includes("normalizedCode === \"unsupported_archive_shape\""), true);
  assert.equal(source.includes("normalizedCode === \"csv_validation_failed\""), true);
  assert.equal(source.includes("reasonCode?.toLowerCase()"), true);
});

test("platform guide panel reflects the actual backend support matrix", async () => {
  const source = await readFile(uploadStepperPath, "utf8");

  // Support matrix cells must reflect backend truth
  assert.equal(source.includes("Patreon, Substack"), true);
  assert.equal(source.includes("Native CSV"), true);
  assert.equal(source.includes("YouTube"), true);
  assert.equal(source.includes("Analytics CSV or Takeout ZIP"), true);
  assert.equal(source.includes("Instagram, TikTok"), true);
  assert.equal(source.includes("Allowlisted ZIP only"), true);

  // Stale text must not appear
  assert.equal(source.includes("CSV or selected ZIP"), false);
  assert.equal(source.includes("Patreon, Substack, YouTube"), false);
  assert.equal(source.includes("Instagram Performance, TikTok Performance"), false);
  assert.equal(source.includes("template-based normalized CSV"), false);
});

test("platform-specific file guidance uses per-platform strings from card metadata", async () => {
  const source = await readFile(uploadStepperPath, "utf8");

  // Subtitle must come from platform card guidance, not hardcoded per-platform conditionals
  assert.equal(source.includes("selectedPlatformCard?.guidance ?? "), true);
  assert.equal(source.includes("Upload the template-based normalized CSV or a selected supported ZIP"), false);
  assert.equal(source.includes("Upload the template-based normalized CSV for this platform"), false);
});
