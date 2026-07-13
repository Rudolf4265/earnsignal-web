import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const uploadStepperPath = path.resolve("app/(app)/app/_components/upload/upload-stepper.tsx");

test("upload flow is manifest-driven with automatic platform detection instead of a manual picker", async () => {
  const source = await readFile(uploadStepperPath, "utf8");

  assert.equal(source.includes("/app/help#upload-guide"), true);
  assert.equal(source.includes("sourceManifest: NormalizedSourceManifest;"), true);
  assert.equal(source.includes("visiblePlatformCards: UploadPlatformCardMetadata[];"), true);
  // Manual platform-picker step was intentionally removed in favor of
  // detecting the platform from the dropped file.
  assert.equal(source.includes("detectPlatformFromFile"), true);
  assert.equal(source.includes("PLATFORM_EXPORT_LINKS"), true);
  assert.equal(source.includes("Choose platform"), false);
  assert.equal(source.includes("Source types"), false);
  assert.equal(source.includes("getPlatformRoleBadgeLabel"), false);
  assert.equal(source.includes("getPlatformRoleDetail"), false);
  assert.equal(source.includes("UPLOAD_PLATFORM_CARDS"), false);
});

test("upload file step uses manifest card guidance without source-taxonomy copy", async () => {
  const source = await readFile(uploadStepperPath, "utf8");

  assert.equal(source.includes('data-testid="upload-drop-zone"'), true);
  assert.equal(source.includes("selectedPlatformCard.contributionLabel"), false);
  assert.equal(source.includes("selectedPlatformCard?.guidance"), false);
  assert.equal(source.includes("selectedPlatformCard?.roleSummary"), false);
  assert.equal(source.includes(".csv or .zip — platform detected automatically"), true);
  assert.equal(source.includes("Click or drop a file here"), true);
  assert.equal(source.includes("Drag and drop is supported by your browser as well."), false);
  assert.equal(source.includes("attachSelectedFile(selectedFile);"), true);
  assert.equal(source.includes("onDrop={(event) => {"), true);
  assert.equal(source.includes("onDragOver={(event) => {"), true);
  assert.equal(source.includes("event.dataTransfer.dropEffect = \"copy\";"), true);
  assert.equal(source.includes("isFileDragPayload"), true);
  assert.equal(source.includes("getPlatformRoleDetail(selectedPlatformCard.platformRole)"), false);
  assert.equal(source.includes("selectedPlatformCard?.importMode"), false);
  assert.equal(source.includes("supportedRevenueUploads"), false);
});
