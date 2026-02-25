import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const clientModuleUrl = pathToFileURL(path.resolve("src/lib/supabase/client.ts")).href;

function buildWindowStub() {
  return {
    location: {
      origin: "http://localhost:3000",
      href: "http://localhost:3000/login",
      hash: "",
      search: "",
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    history: {
      replaceState: () => {},
    },
  };
}

async function importClientModule(cacheKey) {
  try {
    return await import(`${clientModuleUrl}?${cacheKey}=${Date.now()}`);
  } catch (error) {
    if (error && error.code === "ERR_MODULE_NOT_FOUND") {
      return null;
    }

    throw error;
  }
}

test("createClient throws on server runtime", async (t) => {
  delete global.window;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

  const mod = await importClientModule("server");

  if (!mod) {
    t.skip("@supabase/supabase-js is not available in this environment");
    return;
  }

  assert.throws(
    () => mod.createClient(),
    /browser client cannot be created on the server/i,
  );
});

test("createClient can initialize in browser-like runtime with NEXT_PUBLIC env", async (t) => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

  global.window = buildWindowStub();
  global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  };

  const mod = await importClientModule("browser");

  if (!mod) {
    t.skip("@supabase/supabase-js is not available in this environment");
    delete global.window;
    delete global.localStorage;
    return;
  }

  assert.doesNotThrow(() => mod.createClient());
  assert.equal(typeof mod.createClient().auth.getSession, "function");

  delete global.window;
  delete global.localStorage;
});
