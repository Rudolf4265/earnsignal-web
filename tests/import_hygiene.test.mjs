import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

const sourceFiles = [
  "src/lib/upload/polling.ts",
  "src/lib/api/entitlements.ts",
  "app/(app)/layout.tsx",
];

test("app source files avoid explicit .ts/.tsx import extensions", async () => {
  for (const file of sourceFiles) {
    const source = await readFile(path.resolve(file), "utf8");
    assert.equal(/from\s+["'][^"']+\.(ts|tsx)["']/.test(source), false, `found forbidden extension import in ${file}`);
  }
});
