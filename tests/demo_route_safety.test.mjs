import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const debugRoutesModuleUrl = pathToFileURL(path.resolve("src/lib/debug/routes.ts")).href;
const demoPagePath = path.resolve("app/(app)/app/debug/demo/page.tsx");
const qaPagePath = path.resolve("app/(app)/app/debug/qa/page.tsx");
const liveDashboardPath = path.resolve("app/(app)/app/page.tsx");

test("demo route is only advertised outside production when debug mode is explicitly enabled", async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousDebug = process.env.NEXT_PUBLIC_ENABLE_DEBUG;

  process.env.NODE_ENV = "development";
  process.env.NEXT_PUBLIC_ENABLE_DEBUG = "true";
  const enabled = await import(`${debugRoutesModuleUrl}?t=${Date.now()}-enabled`);
  assert.equal(enabled.DEBUG_DEMO_ROUTE, "/app/debug/demo");

  process.env.NEXT_PUBLIC_ENABLE_DEBUG = "false";
  const disabled = await import(`${debugRoutesModuleUrl}?t=${Date.now()}-disabled`);
  assert.equal(disabled.DEBUG_DEMO_ROUTE, undefined);

  process.env.NODE_ENV = previousNodeEnv;
  process.env.NEXT_PUBLIC_ENABLE_DEBUG = previousDebug;
});

test("demo route source keeps the page isolated and clearly labeled", async () => {
  const source = await readFile(demoPagePath, "utf8");

  assert.equal(source.includes('process.env.NODE_ENV === "production"'), true);
  assert.equal(source.includes('process.env.NEXT_PUBLIC_ENABLE_DEBUG !== "true"'), true);
  assert.equal(source.includes("notFound()"), true);
  assert.equal(source.includes('data-testid="demo-workspace-banner"'), true);
  assert.equal(source.includes('data-testid="demo-persona-selector"'), true);
  assert.equal(source.includes("Sample data only"), true);
  assert.equal(source.includes("Live workspace behavior, upload support, and report flows are unchanged."), true);
});

test("internal QA page links to the demo workspace route when available", async () => {
  const source = await readFile(qaPagePath, "utf8");

  assert.equal(source.includes("DEBUG_DEMO_ROUTE"), true);
  assert.equal(source.includes('label: "Demo workspaces"'), true);
});

test("live dashboard path remains free of demo dependencies by default", async () => {
  const source = await readFile(liveDashboardPath, "utf8");

  assert.equal(source.includes("src/lib/demo"), false);
  assert.equal(source.includes("/app/debug/demo"), false);
  assert.equal(source.includes("DEMO_WORKSPACE_QUERY_PARAM"), false);
});
