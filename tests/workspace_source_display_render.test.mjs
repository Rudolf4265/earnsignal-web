import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";

const sourceDisplayPath = path.resolve("src/lib/workspace/source-display.ts");

test("workspace source display uses Uploaded for ready staged source labels", async () => {
  const source = await readFile(sourceDisplayPath, "utf8");

  assert.equal(source.includes('return "Uploaded";'), true);
  assert.equal(source.includes('label: "Uploaded"'), true);
  assert.equal(source.includes('return "Connected";'), false);
  assert.equal(source.includes('label: "Connected"'), false);
});
