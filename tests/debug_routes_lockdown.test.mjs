import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

async function readSource(file) {
  return readFile(path.resolve(file), "utf8");
}

test("debug env routes are disabled for production builds", async () => {
  const apiSource = await readSource("app/api/debug/env/route.ts");
  const appSource = await readSource("app/(app)/app/debug/env/page.tsx");
  const publicSource = await readSource("app/debug/env/page.tsx");

  assert.equal(apiSource.includes('process.env.NODE_ENV !== "production"'), true);
  assert.equal(apiSource.includes('NEXT_PUBLIC_ENABLE_DEBUG === "true"'), true);
  assert.equal(apiSource.includes("status: 404"), true);

  assert.equal(appSource.includes('process.env.NODE_ENV === "production"'), true);
  assert.equal(appSource.includes('NEXT_PUBLIC_ENABLE_DEBUG !== "true"'), true);
  assert.equal(appSource.includes("notFound()"), true);

  assert.equal(publicSource.includes('process.env.NODE_ENV === "production"'), true);
  assert.equal(publicSource.includes('NEXT_PUBLIC_ENABLE_DEBUG !== "true"'), true);
  assert.equal(publicSource.includes("notFound()"), true);
});
