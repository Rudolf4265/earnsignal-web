import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const helpPagePath = path.resolve("app/(app)/app/help/page.tsx");

test("help page renders onboarding, upload guidance, and troubleshooting entry points", async () => {
  const source = await readFile(helpPagePath, "utf8");

  assert.equal(source.includes('data-testid="help-page-hero"'), true);
  assert.equal(source.includes('data-testid="help-page-how-it-works"'), true);
  assert.equal(source.includes('data-testid="help-page-mode-guide"'), true);
  assert.equal(source.includes('data-testid="help-page-upload-guide"'), true);
  assert.equal(source.includes('data-testid="help-page-after-upload"'), true);
  assert.equal(source.includes('data-testid="help-page-troubleshooting"'), true);
  assert.equal(source.includes("getSupportedRevenueUploadFormatGuidance"), true);
  assert.equal(source.includes("Quick help for first uploads"), true);
  assert.equal(source.includes("Quick orientation"), true);
  assert.equal(source.includes("Upload guide"), true);
  assert.equal(source.includes("Need help uploading?"), true);
  assert.equal(source.includes("Currently supported uploads are {supportedRevenueUploads}."), true);
  assert.equal(source.includes("{supportedRevenueUploadFormatGuidance}"), true);
  assert.equal(source.includes("Richer scorecards appear when supported analytics are available."), true);
  assert.equal(source.includes("Instagram uploads"), false);
  assert.equal(source.includes("TikTok uploads"), false);
  assert.equal(source.includes('href="/app/data"'), true);
  assert.equal(source.includes('href="/app"'), true);
});
