import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

async function readSource(file) {
  return readFile(path.resolve(file), "utf8");
}

test("/app/data page is canonical and not a re-export", async () => {
  const source = await readSource("app/(app)/app/data/page.tsx");

  assert.equal(source.includes('export { default } from "../upload/page";'), false);
  assert.equal(source.includes("DataUploadPage"), true);
});

test("/app landing redirects to /app/data and dashboard remains available on /app/dashboard", async () => {
  const [landingSource, dashboardSource] = await Promise.all([
    readSource("app/(app)/app/page.tsx"),
    readSource("app/(app)/app/dashboard/page.tsx"),
  ]);

  assert.equal(landingSource.includes('redirect("/app/data")'), true);
  assert.equal(dashboardSource.includes("export default function DashboardPage()"), true);
  assert.equal(dashboardSource.includes("DashboardHeader"), true);
});

test("/app/upload page performs redirect to /app/data", async () => {
  const source = await readSource("app/(app)/app/upload/page.tsx");

  assert.equal(source.includes('redirect("/app/data")'), true);
});

test("auth entry points fall back to /app/data after successful sign-in", async () => {
  const [loginSource, signupSource, callbackSource] = await Promise.all([
    readSource("app/(auth)/login/page.tsx"),
    readSource("app/(auth)/signup/page.tsx"),
    readSource("app/(auth)/auth/callback/page.tsx"),
  ]);

  assert.equal(loginSource.includes('router.replace(resolvedReturnTo ?? "/app/data")'), true);
  assert.equal(signupSource.includes('router.push("/app/data")'), true);
  assert.equal(callbackSource.includes('resolveReturnTo(new URLSearchParams(window.location.search).get("returnTo")) ?? "/app/data"'), true);
});

test("workspace nav uses stable test IDs and active-route hook", async () => {
  const source = await readSource("app/(app)/_components/workspace-nav.tsx");

  assert.equal(source.includes("data-testid={getAppNavTestId(link.id)}"), true);
  assert.equal(source.includes('aria-current={isActive ? "page" : undefined}'), true);
  assert.equal(source.includes("pathname.startsWith(`${link.href}/`)"), true);
});

test("workspace shell paths do not filter out billing links", async () => {
  const layoutSource = await readSource("app/(app)/layout.tsx");
  const appShellSource = await readSource("app/(app)/_components/app-shell.tsx");

  assert.equal(layoutSource.includes("<WorkspaceNav"), true);
  assert.equal(appShellSource.includes("<WorkspaceNav"), true);
  assert.equal(appShellSource.includes('link.href !== "/app/billing"'), false);
});
