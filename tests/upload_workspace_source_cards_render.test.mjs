import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const dataUploadPagePath = path.resolve("app/(app)/app/_components/upload/data-upload-page.tsx");
const helpPagePath = path.resolve("app/(app)/app/help/page.tsx");
const settingsPagePath = path.resolve("app/(app)/app/settings/page.tsx");

test("workspace source cards stay scan-first while Settings keeps advanced source metadata", async () => {
  const [dataUploadPage, helpPage, settingsPage] = await Promise.all([
    readFile(dataUploadPagePath, "utf8"),
    readFile(helpPagePath, "utf8"),
    readFile(settingsPagePath, "utf8"),
  ]);

  assert.equal(dataUploadPage.includes('data-testid={`workspace-source-card-${item.id}`}'), true);
  assert.equal(dataUploadPage.includes("Manage details in Settings"), true);
  assert.equal(dataUploadPage.includes("Contribution"), false);
  assert.equal(dataUploadPage.includes("Next run"), false);
  assert.equal(dataUploadPage.includes("report-driving"), false);
  assert.equal(dataUploadPage.includes("optional context"), false);
  assert.equal(dataUploadPage.includes("Accepted format:"), false);

  assert.equal(helpPage.includes("Exact file rules and edge cases stay here, not in the workspace cards."), true);
  assert.equal(helpPage.includes("card.guidance"), true);
  assert.equal(helpPage.includes("card.knownLimitations.map"), true);

  assert.equal(settingsPage.includes("AdvancedDataSourcesPanel"), true);
  assert.equal(settingsPage.includes("Included in next run"), true);
  assert.equal(settingsPage.includes("Report-driving"), true);
  assert.equal(settingsPage.includes("Optional context"), true);
});
