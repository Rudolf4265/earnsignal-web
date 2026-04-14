import { test as setup, expect, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { authStatePath, getBaseUrl, getCredentials, type E2ERole } from "./helpers/env";

const roles: E2ERole[] = ["free", "report", "pro"];

async function loginAs(page: Page, role: E2ERole) {
  const credentials = getCredentials(role);
  await page.goto(`${getBaseUrl()}/login`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible({ timeout: 30_000 });
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Password").fill(credentials.password);
  await Promise.all([
    page.waitForURL(/\/app(?:\/|$)/, { timeout: 60_000 }),
    page.getByRole("button", { name: /^log in$/i }).click(),
  ]);
  await page.context().storageState({ path: authStatePath(role) });
}

setup("authenticate free, report, and pro personas @truth-gate @smoke @entitlements @pdf @combined-report", async ({ browser }) => {
  fs.mkdirSync(path.resolve(process.cwd(), "tests", "e2e", ".auth"), { recursive: true });

  for (const role of roles) {
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await loginAs(page, role);
    } finally {
      await context.close();
    }
  }
});
