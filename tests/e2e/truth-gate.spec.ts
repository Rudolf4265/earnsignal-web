import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { existsSync } from "node:fs";
import path from "node:path";

type NetworkViolation = {
  kind: "request" | "response";
  message: string;
};

const INVALID_REPORT_ID_TOKENS = new Set(["undefined", "null", "nan"]);
const MONITORED_PATH_PATTERNS: RegExp[] = [
  /^\/v1\/uploads(?:\/|$)/i,
  /^\/v1\/reports(?:\/|$)/i,
  /^\/v1\/entitlements(?:\/|$)/i,
  /^\/app(?:\/|$)/i,
  /^\/login(?:\/|$)/i,
  /^\/auth\/callback(?:\/|$)/i,
];

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function resolveUploadFixturePath(): string {
  const configured = process.env.E2E_UPLOAD_FIXTURE?.trim() || "tests/fixtures/patreon_minimal.csv";
  const absolute = path.isAbsolute(configured) ? configured : path.resolve(process.cwd(), configured);
  if (!existsSync(absolute)) {
    throw new Error(
      `Upload fixture file was not found: ${absolute}. Set E2E_UPLOAD_FIXTURE to a valid CSV fixture path in this repo.`,
    );
  }

  return absolute;
}

function parseUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

function normalizeReportIdToken(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (INVALID_REPORT_ID_TOKENS.has(trimmed.toLowerCase())) {
    return null;
  }

  return trimmed;
}

function extractReportIdFromHref(href: string | null): string | null {
  if (!href) {
    return null;
  }

  const parsed = parseUrl(href.startsWith("http://") || href.startsWith("https://") ? href : `http://local${href}`);
  if (!parsed) {
    return null;
  }

  const match = parsed.pathname.match(/^\/app\/report\/([^/?#]+)$/i);
  if (!match) {
    return null;
  }

  try {
    return normalizeReportIdToken(decodeURIComponent(match[1]));
  } catch {
    return normalizeReportIdToken(match[1]);
  }
}

function isRelevantMonitoredPath(pathname: string): boolean {
  return MONITORED_PATH_PATTERNS.some((pattern) => pattern.test(pathname));
}

function shouldMonitorResponse(url: string, appOrigin: string, apiOrigin: string | null): boolean {
  const parsed = parseUrl(url);
  if (!parsed) {
    return false;
  }

  const knownOrigin = parsed.origin === appOrigin || (apiOrigin !== null && parsed.origin === apiOrigin);
  if (!knownOrigin) {
    return false;
  }

  return isRelevantMonitoredPath(parsed.pathname);
}

function formatNetworkViolations(violations: NetworkViolation[]): string {
  if (violations.length === 0) {
    return "none";
  }

  return violations.map((violation, index) => `${index + 1}. [${violation.kind}] ${violation.message}`).join("\n");
}

function installNetworkGuards(params: {
  page: Page;
  appOrigin: string;
  apiOrigin: string | null;
  log: (message: string) => void;
}) {
  const { page, appOrigin, apiOrigin, log } = params;
  const violations: NetworkViolation[] = [];

  const onRequest = (request: import("@playwright/test").Request) => {
    const url = request.url();
    const parsed = parseUrl(url);
    if (!parsed) {
      return;
    }

    const knownOrigin = parsed.origin === appOrigin || (apiOrigin !== null && parsed.origin === apiOrigin);
    if (!knownOrigin) {
      return;
    }

    if (/\/v1\/reports\/undefined$/i.test(parsed.pathname)) {
      const message = `${request.method()} ${url}`;
      violations.push({
        kind: "request",
        message: `Disallowed undefined report request detected: ${message}`,
      });
      log(`NETWORK VIOLATION: ${message}`);
    }
  };

  const onResponse = (response: import("@playwright/test").Response) => {
    const status = response.status();
    const request = response.request();
    const url = response.url();

    if (!shouldMonitorResponse(url, appOrigin, apiOrigin)) {
      return;
    }

    if (status === 401 || status === 403) {
      const message = `${request.method()} ${url} returned ${status}`;
      violations.push({
        kind: "response",
        message: `Authorization response detected (${status}): ${message}`,
      });
      log(`NETWORK VIOLATION: ${message}`);
      return;
    }

    if (status >= 500) {
      const message = `${request.method()} ${url} returned ${status}`;
      violations.push({
        kind: "response",
        message: `Server error response detected (${status}): ${message}`,
      });
      log(`NETWORK VIOLATION: ${message}`);
    }
  };

  page.on("request", onRequest);
  page.on("response", onResponse);

  return {
    assertNoViolations: (phase: string) => {
      if (violations.length > 0) {
        throw new Error(
          `Network guard failed during ${phase}.\nDetected violations:\n${formatNetworkViolations(violations)}`,
        );
      }
    },
    getViolations: () => [...violations],
    detach: () => {
      page.off("request", onRequest);
      page.off("response", onResponse);
    },
  };
}

async function collectReportIdsFromVisibleTable(page: Page): Promise<string[]> {
  const reportTable = page.getByTestId("report-list");
  const tableVisible = await reportTable.isVisible().catch(() => false);
  if (!tableVisible) {
    return [];
  }

  const viewLinks = reportTable.getByRole("link", { name: "View" });
  const count = await viewLinks.count();
  const ids: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const href = await viewLinks.nth(index).getAttribute("href");
    const reportId = extractReportIdFromHref(href);
    if (reportId) {
      ids.push(reportId);
    }
  }

  return ids;
}

async function waitForUploadReady(params: {
  page: Page;
  log: (message: string) => void;
  assertNoViolations: (phase: string) => void;
  timeoutMs?: number;
}): Promise<{ reportHref: string; reportId: string }> {
  const { page, log, assertNoViolations } = params;
  const timeoutMs = params.timeoutMs ?? 3 * 60 * 1000;
  const startedAt = Date.now();

  for (let attempt = 1; Date.now() - startedAt <= timeoutMs; attempt += 1) {
    assertNoViolations(`upload polling attempt ${attempt}`);

    const successBannerVisible = await page.getByTestId("upload-terminal-success").isVisible().catch(() => false);
    const viewReportLink = page.getByTestId("upload-view-report");
    const viewReportVisible = await viewReportLink.isVisible().catch(() => false);

    if (successBannerVisible || viewReportVisible) {
      const href = await viewReportLink.getAttribute("href");
      const reportId = extractReportIdFromHref(href);
      if (!href || !reportId) {
        throw new Error(
          `Upload reached done state but canonical report link is missing or invalid (href=${href ?? "null"}).`,
        );
      }
      log(`Upload is ready on attempt ${attempt}. Report link: ${href}, report_id: ${reportId}`);
      return { reportHref: href, reportId };
    }

    const terminalError = page.getByTestId("upload-terminal-error");
    if (await terminalError.isVisible().catch(() => false)) {
      const errorText = (await terminalError.innerText().catch(() => "Unknown upload terminal error")).trim();
      throw new Error(`Upload failed before report became ready. UI error: ${errorText}`);
    }

    const statusMessages = await page
      .locator("p")
      .filter({ hasText: /Preparing|Uploading|Finalizing|Processing upload|Checking previous upload|Retrying status check|Report ready|Working/i })
      .allInnerTexts()
      .catch(() => []);
    const latestStatus = statusMessages.length > 0 ? statusMessages[statusMessages.length - 1] : "status unavailable";
    log(`Waiting for upload readiness (attempt ${attempt}, elapsed ${Math.round((Date.now() - startedAt) / 1000)}s): ${latestStatus}`);
    await page.waitForTimeout(5_000);
  }

  throw new Error(
    `Timed out after ${Math.round(timeoutMs / 1000)} seconds waiting for upload completion. Check backend processing and status transitions.`,
  );
}

async function waitForExpectedReportInList(params: {
  page: Page;
  log: (message: string) => void;
  assertNoViolations: (phase: string) => void;
  expectedReportId: string;
  baselineReportIds: Set<string>;
  timeoutMs?: number;
}) {
  const { page, log, assertNoViolations, expectedReportId, baselineReportIds } = params;
  const timeoutMs = params.timeoutMs ?? 2 * 60 * 1000;
  const startedAt = Date.now();
  const seenReportIds = new Set<string>();

  await page.goto("/app/report", { waitUntil: "domcontentloaded" });

  for (let attempt = 1; Date.now() - startedAt <= timeoutMs; attempt += 1) {
    assertNoViolations(`report list polling attempt ${attempt}`);

    const reportTable = page.getByTestId("report-list");
    const tableVisible = await reportTable.isVisible().catch(() => false);
    if (tableVisible) {
      const viewLinks = reportTable.getByRole("link", { name: "View" });
      const viewCount = await viewLinks.count();
      if (viewCount > 0) {
        let matchedIndex: number | null = null;
        const visibleIds: string[] = [];
        for (let index = 0; index < viewCount; index += 1) {
          const href = await viewLinks.nth(index).getAttribute("href");
          const reportId = extractReportIdFromHref(href);
          if (!reportId) {
            continue;
          }

          visibleIds.push(reportId);
          seenReportIds.add(reportId);
          if (reportId === expectedReportId) {
            matchedIndex = index;
          }
        }

        log(
          `Report list attempt ${attempt}: ${viewCount} view action(s), valid report IDs seen: ${visibleIds.join(", ") || "none"}`,
        );
        if (matchedIndex !== null) {
          const wasInBaseline = baselineReportIds.has(expectedReportId);
          if (wasInBaseline) {
            throw new Error(
              `Upload completed with report_id=${expectedReportId}, but this report already existed before this run. Expected a new report tied to this upload.`,
            );
          }

          return viewLinks.nth(matchedIndex);
        }
      }
      log(`Report table visible on attempt ${attempt}, but expected report_id=${expectedReportId} is not available yet.`);
    } else {
      const emptyStateVisible = await page.getByText("No reports yet").isVisible().catch(() => false);
      log(`Report table not visible on attempt ${attempt}. Empty state visible: ${emptyStateVisible}`);
    }

    await page.waitForTimeout(5_000);
    await page.reload({ waitUntil: "domcontentloaded" });
  }

  throw new Error(
    `Timed out after ${Math.round(timeoutMs / 1000)} seconds waiting for report_id=${expectedReportId} in /app/report. Baseline IDs: ${
      [...baselineReportIds].join(", ") || "none"
    }. Seen after upload: ${[...seenReportIds].join(", ") || "none"}.`,
  );
}

async function attachDebugArtifacts(testInfo: TestInfo, logs: string[], violations: NetworkViolation[]) {
  await testInfo.attach("truth-gate-debug.log", {
    body: Buffer.from(logs.join("\n"), "utf8"),
    contentType: "text/plain",
  });

  await testInfo.attach("truth-gate-network-violations.log", {
    body: Buffer.from(formatNetworkViolations(violations), "utf8"),
    contentType: "text/plain",
  });
}

test.describe("Truth Gate", () => {
  test("sign in -> upload -> report -> detail -> pdf", async ({ page }, testInfo) => {
    const baseUrl = requireEnv("E2E_BASE_URL");
    const email = requireEnv("E2E_EMAIL");
    const password = requireEnv("E2E_PASSWORD");
    const fixturePath = resolveUploadFixturePath();
    const appOrigin = new URL(baseUrl).origin;
    const apiOrigin = process.env.E2E_API_BASE_URL?.trim() ? new URL(process.env.E2E_API_BASE_URL).origin : null;

    const logs: string[] = [];
    const log = (message: string) => {
      const entry = `[truth-gate ${new Date().toISOString()}] ${message}`;
      logs.push(entry);
      console.log(entry);
    };

    const guards = installNetworkGuards({ page, appOrigin, apiOrigin, log });
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        log(`Browser console error: ${msg.text()}`);
      }
    });

    try {
      log(`Using base URL: ${baseUrl}`);
      log(`Using upload fixture: ${fixturePath}`);

      await test.step("Sign in", async () => {
        await page.goto("/login", { waitUntil: "domcontentloaded" });
        await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
        await page.getByLabel("Email").fill(email);
        await page.getByLabel("Password").fill(password);
        await Promise.all([
          page.waitForURL(/\/app(?:\/|$)/, { timeout: 60_000 }),
          page.getByRole("button", { name: /log in/i }).click(),
        ]);
        await expect(page.getByTestId("nav-dashboard")).toBeVisible({ timeout: 60_000 });
        guards.assertNoViolations("post-login");
      });

      const baselineReportIds = await test.step("Capture pre-upload report baseline", async () => {
        await page.goto("/app/report", { waitUntil: "domcontentloaded" });
        const ids = await collectReportIdsFromVisibleTable(page);
        log(`Pre-upload report baseline IDs (${ids.length}): ${ids.join(", ") || "none"}`);
        guards.assertNoViolations("pre-upload baseline");
        return new Set(ids);
      });

      let uploadResult: { reportHref: string; reportId: string } | null = null;
      await test.step("Upload fixture and wait for ready report", async () => {
        await page.goto("/app/data", { waitUntil: "domcontentloaded" });
        await page.evaluate(() => window.localStorage.removeItem("earnsignal:last_upload_id"));
        await page.reload({ waitUntil: "domcontentloaded" });

        await expect(page.getByText("Choose platform")).toBeVisible({ timeout: 30_000 });
        await page.getByRole("button", { name: "Patreon" }).click();
        await page.getByRole("button", { name: "Continue" }).click();

        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles(fixturePath);
        await page.getByRole("button", { name: /Upload & Validate/i }).click();

        uploadResult = await waitForUploadReady({
          page,
          log,
          assertNoViolations: guards.assertNoViolations,
        });
        log(`Upload produced report link: ${uploadResult.reportHref}`);
        guards.assertNoViolations("post-upload");
      });

      if (!uploadResult) {
        throw new Error("Upload step did not produce a report result. Cannot continue with report verification.");
      }

      await test.step("Open report generated by this upload run", async () => {
        const expectedReportId = uploadResult.reportId;
        const latestViewLink = await waitForExpectedReportInList({
          page,
          log,
          assertNoViolations: guards.assertNoViolations,
          expectedReportId,
          baselineReportIds,
        });
        const href = await latestViewLink.getAttribute("href");
        const hrefReportId = extractReportIdFromHref(href);
        if (!href || !hrefReportId) {
          throw new Error(`Report list returned an invalid View href: ${href ?? "null"}`);
        }
        if (hrefReportId !== expectedReportId) {
          throw new Error(
            `Report list selected wrong report. Expected report_id=${expectedReportId}, but selected ${hrefReportId}.`,
          );
        }

        log(`Opening report_id=${hrefReportId} from /app/report list.`);

        await Promise.all([
          page.waitForURL(new RegExp(`/app/report/${expectedReportId}(?:\\?.*)?$`), { timeout: 60_000 }),
          latestViewLink.click(),
        ]);

        await expect(page.getByTestId("report-not-found")).toHaveCount(0);
        await expect(page.getByText("Report not found")).toHaveCount(0);
        await expect(page.getByTestId("report-content")).toBeVisible({ timeout: 60_000 });
        guards.assertNoViolations("post-report-detail-navigation");
      });

      await test.step("Verify PDF endpoint call succeeds", async () => {
        const detailUrl = page.url();
        log(`Report detail URL: ${detailUrl}`);

        const downloadButton = page.getByRole("button", { name: /Download PDF/i }).first();
        await expect(downloadButton).toBeVisible({ timeout: 30_000 });

        const pdfResponsePromise = page.waitForResponse(
          (response) => {
            const request = response.request();
            if (request.method() !== "GET") {
              return false;
            }

            const parsed = parseUrl(response.url());
            if (!parsed) {
              return false;
            }

            const pathname = parsed.pathname.toLowerCase();
            return pathname.includes("/artifact") || pathname.endsWith(".pdf") || pathname.includes("/reports/");
          },
          { timeout: 90_000 },
        );

        await downloadButton.click();
        const pdfResponse = await pdfResponsePromise;
        const status = pdfResponse.status();
        log(`PDF response: ${pdfResponse.request().method()} ${pdfResponse.url()} -> ${status}`);

        if (status !== 200 && status !== 302) {
          throw new Error(
            `PDF endpoint did not return an expected status (received ${status}, expected 200 or 302). URL: ${pdfResponse.url()}`,
          );
        }

        guards.assertNoViolations("post-pdf-check");
      });

      guards.assertNoViolations("test completion");
      log("Truth gate completed successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Truth gate failed with actionable context: ${message}`);
    } finally {
      guards.detach();
      await attachDebugArtifacts(testInfo, logs, guards.getViolations());
    }
  });
});
