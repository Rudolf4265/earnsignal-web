import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

async function buildApiClientModule(tag) {
  const source = await readFile(path.resolve("src/lib/api/client.ts"), "utf8");
  const withHttpPath = source.replace('from "./http";', 'from "../src/lib/api/http.ts";');
  const patched = withHttpPath.replace('import("../supabase/client")', 'import("./mocks/supabase-client.ts")');

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

function jsonResponse(payload) {
  return {
    status: 200,
    ok: true,
    headers: { get: () => "application/json" },
    text: async () => JSON.stringify(payload),
  };
}

test("apiClientJson adds Authorization header for logged-in browser sessions", async () => {
  const originalFetch = global.fetch;
  const originalWindow = global.window;
  global.window = { location: { hostname: "app.earnsigma.com", protocol: "https:" } };

  const requests = [];
  global.fetch = async (_url, init = {}) => {
    requests.push(init);
    return jsonResponse({ ok: true });
  };

  try {
    const moduleUrl = await buildApiClientModule(Date.now());
    const { apiClientJson } = await import(moduleUrl);

    await apiClientJson("/v1/entitlements", { method: "GET" }, "billing status");

    const firstHeaders = requests[0].headers;
    assert.equal(firstHeaders.Authorization, "Bearer test-token");
    assert.equal(firstHeaders.Accept, "application/json");
  } finally {
    global.fetch = originalFetch;
    global.window = originalWindow;
  }
});
