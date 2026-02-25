import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientPath = path.resolve(__dirname, "../src/lib/supabase/client.ts");

function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

test("supabase browser client avoids dynamic env indexing", async () => {
  const source = stripComments(await readFile(clientPath, "utf8"));

  assert.equal(source.includes("process.env["), false, "must not use process.env[...] indexing");
  assert.equal(source.includes("process.env[name]"), false, "must not use computed env key access");
  assert.equal(source.includes("getRequiredPublicEnv("), false, "guard helper must not accept dynamic key names");

  assert.match(source, /process\.env\.NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(source, /process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY/);
});
