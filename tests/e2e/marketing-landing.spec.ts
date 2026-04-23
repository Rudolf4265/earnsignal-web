import { expect, test } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const artifactDir = path.resolve(__dirname, "../../artifacts/marketing-landing-polish");

async function screenshotPath(name: string) {
  await fs.mkdir(artifactDir, { recursive: true });
  return path.join(artifactDir, name);
}

test.describe("Marketing landing page", () => {
  test("homepage renders the refined diagnosis-first flow on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.goto("/");

    await expect(page.getByRole("heading", { name: /Know exactly what's driving your income/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Get My Free Preview" }).first()).toBeVisible();
    await expect(page.getByTestId("marketing-trust-strip")).toBeVisible();
    await expect(page.getByText("What creators usually discover")).toBeVisible();
    await expect(page.getByText("Example signal").first()).toBeVisible();
    await expect(page.getByText("Built around the platforms your business runs on")).toBeVisible();
    await expect(page.getByText("DIAGNOSIS, NOT DASHBOARD")).toBeVisible();
    await expect(page.getByText("Income Stability Score").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Pricing" })).toHaveAttribute("href", "/pricing");
    await expect(page.getByRole("contentinfo").getByRole("link", { name: "Privacy", exact: true })).toHaveAttribute("href", "/privacy");
    await expect(page.getByRole("contentinfo").getByRole("link", { name: "Data Use & Privacy" })).toHaveAttribute("href", "/data-privacy");

    await page.screenshot({ path: await screenshotPath("homepage-desktop-top.png"), fullPage: false });
  });

  test("homepage first sections remain usable on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/");

    await expect(page.getByRole("heading", { name: /Know exactly what's driving your income/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Get My Free Preview" }).first()).toBeVisible();
    await expect(page.getByText("Free validation").first()).toBeVisible();

    await page.getByText("What creators usually discover").scrollIntoViewIfNeeded();
    await expect(page.getByText("What creators usually discover")).toBeVisible();
    await expect(page.getByText("Example signal").first()).toBeVisible();

    await page.getByText("Built around the platforms your business runs on").scrollIntoViewIfNeeded();
    await expect(page.getByText("Built around the platforms your business runs on")).toBeVisible();

    await page.screenshot({ path: await screenshotPath("homepage-mobile-top-sections.png"), fullPage: false });
  });

  test("sample report still renders current report terminology", async ({ page }) => {
    await page.goto("/sample-report");

    await expect(page.getByRole("heading", { name: "Anna Reyes" })).toBeVisible();
    await expect(page.getByText("Executive Summary")).toBeVisible();
    await expect(page.getByText("Income Stability Score").first()).toBeVisible();
    await expect(page.getByText("Platform Concentration").first()).toBeVisible();
    await expect(page.getByText("Action Plan").first()).toBeVisible();

    await page.screenshot({ path: await screenshotPath("sample-report-top.png"), fullPage: false });
  });
});
