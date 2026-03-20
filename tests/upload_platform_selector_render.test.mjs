import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const uploadStepperPath = path.resolve("app/(app)/app/_components/upload/upload-stepper.tsx");

test("upload platform selector renders grouped section headers and direct-fan reveal copy", async () => {
  const source = await readFile(uploadStepperPath, "utf8");

  assert.equal(source.includes('data-testid="upload-platform-guide"'), true);
  assert.equal(source.includes("/app/help#upload-guide"), true);
  assert.equal(source.includes("platformSections.map((section) =>"), true);
  assert.equal(source.includes('data-testid={`platform-section-${section.category}`}'), true);
  assert.equal(source.includes("Choose platform"), true);
  assert.equal(source.includes("Select the data source for this upload."), true);
  assert.equal(source.includes("visiblePlatformCards: UploadPlatformCardMetadata[];"), true);
  assert.equal(source.includes("supportedRevenueUploads: string;"), true);
  assert.equal(source.includes("const platformSections = useMemo(() => groupPlatformCards(visiblePlatformCards), [visiblePlatformCards]);"), true);
  assert.equal(source.includes("UPLOAD_PLATFORM_CARDS"), false);
  assert.equal(source.includes("getSupportedRevenueUploadSummary"), false);
});

test("upload platform cards enforce 28x28 contain logos and disable unavailable options", async () => {
  const source = await readFile(uploadStepperPath, "utf8");

  assert.equal(source.includes("Upload accepts {supportedRevenueUploads}"), true);
  assert.equal(source.includes('className="platform-icon block h-5 w-5 object-contain"'), true);
  assert.equal(source.includes("disabled={!available}"), true);
  assert.equal(source.includes("if (!item.available) return;"), true);
  assert.equal(source.includes("setPlatform(item.id);"), true);
  assert.equal(source.includes("Supported"), true);
  assert.equal(source.includes("Coming soon"), true);
});
