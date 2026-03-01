import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

async function buildApiClientModule(tag) {
  const source = await readFile(path.resolve("src/lib/api/client.ts"), "utf8");
  const patched = source.replace('import("../supabase/client")', 'import("./mocks/supabase-client.ts")');

  const outDir = path.resolve(".tmp-tests");
  await mkdir(path.join(outDir, "mocks"), { recursive: true });

  const mockPath = path.join(outDir, "mocks", "supabase-client.ts");
  await writeFile(
    mockPath,
    `export function createClient() {
      return {
        auth: {
          async getSession() {
            return { data: { session: { access_token: "test-token" } } };
          }
        }
      };
    }\n`,
    "utf8",
  );

  const outFile = path.join(outDir, `api-client-${tag}.ts`);
  await writeFile(outFile, patched, "utf8");
  return pathToFileURL(outFile).href;
}

test("apiFetchJson adds Authorization header for logged-in browser sessions", async () => {
  const originalFetch = global.fetch;
  const originalWindow = global.window;
  process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test";
  global.window = { location: { hostname: "app.earnsigma.com", protocol: "https:" } };

  const requests = [];
  global.fetch = async (_url, init = {}) => {
    requests.push(init);
    return {
      status: 200,
      ok: true,
      headers: { get: () => "application/json" },
      text: async () => JSON.stringify({ ok: true }),
    };
  };

  try {
    const moduleUrl = await buildApiClientModule(Date.now());
    const { apiFetchJson } = await import(moduleUrl);

    await apiFetchJson("entitlements.fetch", "/v1/entitlements", { method: "GET" });

    const firstHeaders = requests[0].headers;
    assert.equal(firstHeaders.Authorization, "Bearer test-token");
    assert.equal(firstHeaders.Accept, "application/json");
  } finally {
    global.fetch = originalFetch;
    global.window = originalWindow;
  }
});
