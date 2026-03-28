import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const dataUploadPagePath = path.resolve("app/(app)/app/_components/upload/data-upload-page.tsx");
const helpPagePath = path.resolve("app/(app)/app/help/page.tsx");

test("workspace source cards stay scan-first while Upload Guide keeps detailed support rules", async () => {
  const [dataUploadPage, helpPage] = await Promise.all([
    readFile(dataUploadPagePath, "utf8"),
    readFile(helpPagePath, "utf8"),
  ]);

  assert.equal(dataUploadPage.includes('data-testid={`workspace-source-card-${card.id}`}'), true);
  assert.equal(dataUploadPage.includes("Contribution"), true);
  assert.equal(dataUploadPage.includes("Next run"), true);
  assert.equal(dataUploadPage.includes("Detailed format rules, ZIP support, and troubleshooting live in the Upload Guide."), true);
  assert.equal(dataUploadPage.includes("card.guidance"), false);
  assert.equal(dataUploadPage.includes("card.roleSummary"), false);
  assert.equal(dataUploadPage.includes("card.knownLimitations"), false);
  assert.equal(dataUploadPage.includes("Accepted format:"), false);

  assert.equal(helpPage.includes("Exact file rules and edge cases stay here, not in the workspace cards."), true);
  assert.equal(helpPage.includes("card.guidance"), true);
  assert.equal(helpPage.includes("card.knownLimitations.map"), true);
});
