import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const dataUploadPagePath = path.resolve("app/(app)/app/_components/upload/data-upload-page.tsx");

test("data upload page adds truthful upload, mode, and help guidance", async () => {
  const source = await readFile(dataUploadPagePath, "utf8");

  assert.equal(source.includes('data-testid="data-upload-guide"'), true);
  assert.equal(source.includes("What to upload today"), true);
  assert.equal(source.includes("What happens next"), true);
  assert.equal(source.includes("Need help uploading?"), true);
  assert.equal(source.includes("/app/help#upload-guide"), true);
  assert.equal(
    source.includes("Grow is the audience and engagement side, and richer scorecards appear when supported analytics are available."),
    true,
  );
});
