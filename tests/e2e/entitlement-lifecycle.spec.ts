import { expect, test, type Page } from "@playwright/test";
import { existsSync } from "node:fs";
import path from "node:path";
import {
  resolveAccessGranted,
  resolveAccessReasonCode,
  resolveBillingRequired,
  resolveEffectivePlanTier,
} from "@/src/lib/entitlements/model";

type FixtureKey = "founder" | "revoked" | "expired" | "future";

type LifecycleFixture = {
  key: FixtureKey;
  label: string;
  state: string;
  email: string | null;
  password: string | null;
  expectedAccessGranted: boolean;
  expectedBillingRequired: boolean;
  expectedReasonCode: string | null;
};

type EntitlementsSnapshot = {
  statusCode: number;
  accessGranted: boolean;
  billingRequired: boolean;
  effectivePlanTier: string;
  accessReasonCode: string | null;
  apiOrigin: string;
  entitlementsUrl: string;
  raw: Record<string, unknown>;
};

const INVALID_REPORT_ID_TOKENS = new Set(["undefined", "null", "nan"]);

function envFirst(...names: string[]): string | null {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) {
      return value;
    }
  }
  return null;
}

function optionalReasonCode(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value.toUpperCase() : null;
}

function fixtureFor(key: FixtureKey): LifecycleFixture {
  switch (key) {
    case "founder":
      return {
        key,
        label: "founder protected fixture",
        state: "founder_protected",
        email: envFirst("E2E_LIFECYCLE_FOUNDER_EMAIL", "E2E_FOUNDER_EMAIL", "E2E_EMAIL"),
        password: envFirst("E2E_LIFECYCLE_FOUNDER_PASSWORD", "E2E_FOUNDER_PASSWORD", "E2E_PASSWORD"),
        expectedAccessGranted: true,
        expectedBillingRequired: false,
        expectedReasonCode: optionalReasonCode("E2E_LIFECYCLE_FOUNDER_REASON_CODE"),
      };
    case "revoked":
      return {
        key,
        label: "revoked override fixture",
        state: "override_revoked",
        email: envFirst("E2E_LIFECYCLE_REVOKED_EMAIL"),
        password: envFirst("E2E_LIFECYCLE_REVOKED_PASSWORD"),
        expectedAccessGranted: false,
        expectedBillingRequired: true,
        expectedReasonCode: optionalReasonCode("E2E_LIFECYCLE_REVOKED_REASON_CODE"),
      };
    case "expired":
      return {
        key,
        label: "expired override fixture",
        state: "override_expired",
        email: envFirst("E2E_LIFECYCLE_EXPIRED_EMAIL"),
        password: envFirst("E2E_LIFECYCLE_EXPIRED_PASSWORD"),
        expectedAccessGranted: false,
        expectedBillingRequired: true,
        expectedReasonCode: optionalReasonCode("E2E_LIFECYCLE_EXPIRED_REASON_CODE"),
      };
    case "future":
      return {
        key,
        label: "future-dated override fixture",
        state: "override_future_dated",
        email: envFirst("E2E_LIFECYCLE_FUTURE_EMAIL"),
        password: envFirst("E2E_LIFECYCLE_FUTURE_PASSWORD"),
        expectedAccessGranted: false,
        expectedBillingRequired: true,
        expectedReasonCode: optionalReasonCode("E2E_LIFECYCLE_FUTURE_REASON_CODE"),
      };
    default: {
      const unreachable: never = key;
      throw new Error(`Unsupported fixture key: ${String(unreachable)}`);
    }
  }
}

function fixtureSkipReason(fixture: LifecycleFixture): string {
  if (!fixture.email && !fixture.password) {
    return `Missing ${fixture.label} credentials (set ${fixture.key.toUpperCase()} lifecycle env vars).`;
  }
  if (!fixture.email) {
    return `Missing ${fixture.label} email credential.`;
  }
  return `Missing ${fixture.label} password credential.`;
}

function fixtureCredentialEnvHints(fixture: LifecycleFixture): { email: string[]; password: string[] } {
  switch (fixture.key) {
    case "founder":
      return {
        email: ["E2E_LIFECYCLE_FOUNDER_EMAIL", "E2E_FOUNDER_EMAIL", "E2E_EMAIL"],
        password: ["E2E_LIFECYCLE_FOUNDER_PASSWORD", "E2E_FOUNDER_PASSWORD", "E2E_PASSWORD"],
      };
    case "revoked":
      return {
        email: ["E2E_LIFECYCLE_REVOKED_EMAIL"],
        password: ["E2E_LIFECYCLE_REVOKED_PASSWORD"],
      };
    case "expired":
      return {
        email: ["E2E_LIFECYCLE_EXPIRED_EMAIL"],
        password: ["E2E_LIFECYCLE_EXPIRED_PASSWORD"],
      };
    case "future":
      return {
        email: ["E2E_LIFECYCLE_FUTURE_EMAIL"],
        password: ["E2E_LIFECYCLE_FUTURE_PASSWORD"],
      };
    default: {
      const unreachable: never = fixture.key;
      throw new Error(`Unsupported fixture key: ${String(unreachable)}`);
    }
  }
}

function isCiRuntime(): boolean {
  const value = process.env.CI?.trim().toLowerCase();
  if (!value) {
    return false;
  }

  return value !== "0" && value !== "false";
}

function buildMissingCredentialsMessage(fixtures: readonly LifecycleFixture[]): string | null {
  const missing: string[] = [];

  for (const fixture of fixtures) {
    const hints = fixtureCredentialEnvHints(fixture);
    if (!fixture.email) {
      missing.push(`${fixture.label}: missing email (set one of ${hints.email.join(", ")})`);
    }
    if (!fixture.password) {
      missing.push(`${fixture.label}: missing password (set one of ${hints.password.join(", ")})`);
    }
  }

  if (missing.length === 0) {
    return null;
  }

  return `Lifecycle suite cannot run without fixture credentials.\n${missing.map((entry) => `- ${entry}`).join("\n")}`;
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

function getDeniedProbeReportId(): string {
  return process.env.E2E_LIFECYCLE_DETAIL_PROBE_REPORT_ID?.trim() || "rep_lifecycle_guard_probe";
}

function getDeniedArtifactProbeReportIdFromEnv(): string | null {
  const value = process.env.E2E_LIFECYCLE_DENIED_ARTIFACT_REPORT_ID?.trim();
  return value || null;
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

  let parsed: URL;
  try {
    parsed = new URL(href.startsWith("http://") || href.startsWith("https://") ? href : `http://local${href}`);
  } catch {
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

function isEntitlementsResponse(response: import("@playwright/test").Response): boolean {
  if (response.request().method() !== "GET") {
    return false;
  }

  try {
    const parsed = new URL(response.url());
    return parsed.pathname.endsWith("/v1/entitlements");
  } catch {
    return false;
  }
}

function unwrapEntitlementsPayload(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {};
  }

  const raw = payload as Record<string, unknown>;
  const details = raw.details;
  if (details && typeof details === "object" && !Array.isArray(details)) {
    return { ...(details as Record<string, unknown>), ...raw };
  }

  return raw;
}

async function captureEntitlementsSnapshot(page: Page, trigger: () => Promise<void>): Promise<EntitlementsSnapshot> {
  const responsePromise = page.waitForResponse(isEntitlementsResponse, { timeout: 60_000 });
  await Promise.all([responsePromise, trigger()]);
  const response = await responsePromise;

  let payload: unknown = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  const raw = unwrapEntitlementsPayload(payload);
  const entitlementsUrl = response.url();
  const apiOrigin = new URL(entitlementsUrl).origin;
  return {
    statusCode: response.status(),
    accessGranted: resolveAccessGranted(raw),
    billingRequired: resolveBillingRequired(raw),
    effectivePlanTier: resolveEffectivePlanTier(raw),
    accessReasonCode: resolveAccessReasonCode(raw),
    apiOrigin,
    entitlementsUrl,
    raw,
  };
}

async function signInWithPassword(page: Page, fixture: LifecycleFixture) {
  if (!fixture.email || !fixture.password) {
    throw new Error(`Cannot sign in without credentials for ${fixture.label}.`);
  }

  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  await page.getByLabel("Email").fill(fixture.email);
  await page.getByLabel("Password").fill(fixture.password);

  await Promise.all([
    page.waitForURL(/\/app(?:\/|$)/, { timeout: 90_000 }),
    page.getByRole("button", { name: /log in/i }).click(),
  ]);

  await expect(page.getByTestId("nav-dashboard")).toBeVisible({ timeout: 90_000 });
}

async function enterUploadFlowWithFixture(page: Page, fixturePath: string) {
  await page.goto("/app/data", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => window.localStorage.removeItem("earnsignal:last_upload_id"));
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByText("Choose platform")).toBeVisible({ timeout: 30_000 });

  await page.getByRole("button", { name: "Patreon" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.locator('input[type="file"]').setInputFiles(fixturePath);
}

async function waitForUploadReady(page: Page, timeoutMs = 3 * 60 * 1000): Promise<{ reportHref: string; reportId: string }> {
  const startedAt = Date.now();

  for (let attempt = 1; Date.now() - startedAt <= timeoutMs; attempt += 1) {
    const successVisible = await page.getByTestId("upload-terminal-success").isVisible().catch(() => false);
    const viewReportLink = page.getByTestId("upload-view-report");
    const viewReportVisible = await viewReportLink.isVisible().catch(() => false);

    if (successVisible || viewReportVisible) {
      const href = await viewReportLink.getAttribute("href");
      const reportId = extractReportIdFromHref(href);
      if (!href || !reportId) {
        throw new Error(`Upload reached terminal success but report href is invalid: ${href ?? "null"}`);
      }
      return { reportHref: href, reportId };
    }

    const terminalError = page.getByTestId("upload-terminal-error");
    if (await terminalError.isVisible().catch(() => false)) {
      const errorText = (await terminalError.innerText().catch(() => "Unknown upload error")).trim();
      throw new Error(`Upload failed before ready state. UI error: ${errorText}`);
    }

    await page.waitForTimeout(5_000);
    if (attempt % 2 === 0) {
      await page.reload({ waitUntil: "domcontentloaded" });
    }
  }

  throw new Error(`Timed out after ${Math.round(timeoutMs / 1000)} seconds waiting for upload readiness.`);
}

async function waitForReportLinkInList(page: Page, reportId: string, timeoutMs = 2 * 60 * 1000) {
  const startedAt = Date.now();
  await page.goto("/app/report", { waitUntil: "domcontentloaded" });

  while (Date.now() - startedAt <= timeoutMs) {
    await expect(page).toHaveURL(/\/app\/report(?:\?|$)/);
    const link = page.locator(`[data-testid="report-list"] a[href="/app/report/${reportId}"]`).first();
    const visible = await link.isVisible().catch(() => false);
    if (visible) {
      return link;
    }

    await page.waitForTimeout(5_000);
    await page.reload({ waitUntil: "domcontentloaded" });
  }

  throw new Error(`Timed out waiting for report_id=${reportId} in /app/report list.`);
}

async function assertUpgradeRedirect(page: Page, fromPath: string) {
  await expect(page).toHaveURL(/\/app\/billing\?reason=upgrade_required/);
  const current = new URL(page.url());
  expect(current.pathname).toBe("/app/billing");
  expect(current.searchParams.get("reason")).toBe("upgrade_required");
  expect(current.searchParams.get("from")).toBe(fromPath);
}

async function readSupabaseAccessToken(page: Page): Promise<string> {
  const token = await page.evaluate(() => {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key || !key.startsWith("sb-") || !key.endsWith("-auth-token")) {
        continue;
      }

      const raw = window.localStorage.getItem(key);
      if (!raw) {
        continue;
      }

      try {
        const parsed = JSON.parse(raw) as unknown;
        if (!parsed || typeof parsed !== "object") {
          continue;
        }

        const record = parsed as Record<string, unknown>;
        if (typeof record.access_token === "string" && record.access_token.trim().length > 0) {
          return record.access_token;
        }

        const currentSession = record.currentSession;
        if (currentSession && typeof currentSession === "object") {
          const session = currentSession as Record<string, unknown>;
          if (typeof session.access_token === "string" && session.access_token.trim().length > 0) {
            return session.access_token;
          }
        }

        const session = record.session;
        if (session && typeof session === "object") {
          const candidate = session as Record<string, unknown>;
          if (typeof candidate.access_token === "string" && candidate.access_token.trim().length > 0) {
            return candidate.access_token;
          }
        }
      } catch {
        // Ignore malformed storage entries and continue searching.
      }
    }

    return null;
  });

  if (!token) {
    throw new Error("Unable to read Supabase access token from browser storage after login.");
  }

  return token;
}

async function assertDirectArtifactDenied(params: {
  page: Page;
  apiOrigin: string;
  reportId: string;
  fixtureLabel: string;
}) {
  const { page, apiOrigin, reportId, fixtureLabel } = params;
  const accessToken = await readSupabaseAccessToken(page);
  const artifactUrl = `${apiOrigin}/v1/reports/${encodeURIComponent(reportId)}/artifact`;
  const response = await page.request.get(artifactUrl, {
    failOnStatusCode: false,
    maxRedirects: 0,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/pdf,application/json",
    },
  });

  const status = response.status();
  if (status >= 200 && status < 300) {
    throw new Error(
      `${fixtureLabel} unexpectedly downloaded artifact for report_id=${reportId} (${artifactUrl}) with status ${status}.`,
    );
  }

  if ([301, 302, 303, 307, 308].includes(status)) {
    const location = response.headers()["location"] ?? "";
    expect(location.length > 0).toBeTruthy();
    expect(/billing|upgrade|required/i.test(location)).toBeTruthy();
    return;
  }

  expect([401, 402, 403, 404]).toContain(status);

  if ([401, 402, 403].includes(status)) {
    const contentType = (response.headers()["content-type"] ?? "").toLowerCase();
    if (contentType.includes("application/json")) {
      const body = (await response.json().catch(() => null)) as Record<string, unknown> | null;
      const code = typeof body?.code === "string" ? body.code.toUpperCase() : null;
      if (code) {
        expect([
          "ENTITLEMENT_REQUIRED",
          "BILLING_REQUIRED",
          "PAYMENT_REQUIRED",
          "FORBIDDEN",
          "UNAUTHORIZED",
          "SESSION_EXPIRED",
        ]).toContain(code);
      }
    }
  }
}

const founderFixture = fixtureFor("founder");
const deniedFixtures = [fixtureFor("revoked"), fixtureFor("expired"), fixtureFor("future")] as const;
const allFixtures = [founderFixture, ...deniedFixtures] as const;

test.describe("Entitlement lifecycle (backend fixtures)", () => {
  test.describe.configure({ mode: "serial" });
  let founderGeneratedReportId: string | null = null;

  test.beforeAll(() => {
    if (!isCiRuntime()) {
      return;
    }

    const missingMessage = buildMissingCredentialsMessage(allFixtures);
    if (missingMessage) {
      throw new Error(
        `${missingMessage}\nCI marks skipped tests as green; lifecycle coverage requires explicit credentials.`,
      );
    }
  });

  test("founder/protected fixture keeps paid-equivalent access across premium lifecycle surfaces", async ({ page }) => {
    test.setTimeout(12 * 60 * 1000);
    test.skip(!founderFixture.email || !founderFixture.password, fixtureSkipReason(founderFixture));

    const uploadFixturePath = resolveUploadFixturePath();
    await signInWithPassword(page, founderFixture);

    const bootstrapSnapshot = await captureEntitlementsSnapshot(page, () => page.reload({ waitUntil: "domcontentloaded" }));
    expect(bootstrapSnapshot.statusCode).toBe(200);
    expect(bootstrapSnapshot.accessGranted).toBe(founderFixture.expectedAccessGranted);
    expect(bootstrapSnapshot.billingRequired).toBe(founderFixture.expectedBillingRequired);
    expect(bootstrapSnapshot.effectivePlanTier).not.toBe("none");
    if (founderFixture.expectedReasonCode) {
      expect(bootstrapSnapshot.accessReasonCode).toBe(founderFixture.expectedReasonCode);
    }

    await expect(page.getByTestId("dashboard-action-cards-unlocked")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("dashboard-action-cards-locked")).toHaveCount(0);

    await enterUploadFlowWithFixture(page, uploadFixturePath);
    await expect(page.getByTestId("upload-entitlement-required")).toHaveCount(0);

    const uploadButton = page.getByRole("button", { name: /Upload & Validate/i });
    await expect(uploadButton).toBeEnabled({ timeout: 30_000 });
    await uploadButton.click();

    const uploadReady = await waitForUploadReady(page);
    founderGeneratedReportId = uploadReady.reportId;

    await page.goto("/app", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("dashboard-action-cards-unlocked")).toBeVisible();

    const refreshedSnapshot = await captureEntitlementsSnapshot(page, () => page.reload({ waitUntil: "domcontentloaded" }));
    expect(refreshedSnapshot.accessGranted).toBe(true);
    expect(refreshedSnapshot.billingRequired).toBe(false);

    const reportLink = await waitForReportLinkInList(page, uploadReady.reportId);
    await Promise.all([
      page.waitForURL(new RegExp(`/app/report/${uploadReady.reportId}(?:\\?.*)?$`), { timeout: 60_000 }),
      reportLink.click(),
    ]);

    await expect(page.getByTestId("report-content")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("report-revenue-interpretation")).toBeVisible();
    await expect(page.getByTestId("report-audience-growth-hero")).toBeVisible();
    await expect(page.getByTestId("report-what-to-do-next")).toBeVisible();
    await expect(page.getByTestId("report-debug-accordion")).toHaveCount(0);
    await expect(page.getByTestId("report-pdf-locked")).toHaveCount(0);

    const downloadButton = page.getByRole("button", { name: "Download PDF" }).first();
    await expect(downloadButton).toBeVisible({ timeout: 30_000 });
    const pdfResponsePromise = page.waitForResponse(
      (response) => {
        if (response.request().method() !== "GET") {
          return false;
        }

        try {
          const pathname = new URL(response.url()).pathname.toLowerCase();
          return pathname.includes("/artifact") || pathname.endsWith(".pdf");
        } catch {
          return false;
        }
      },
      { timeout: 90_000 },
    );

    await downloadButton.click();
    const pdfResponse = await pdfResponsePromise;
    expect([200, 302]).toContain(pdfResponse.status());

    await page.goto("/app/billing", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Billing" })).toBeVisible();
    await expect(page.getByText("Feature access: Active")).toBeVisible();
    await expect(page.getByText("Billing action is required to restore premium access.")).toHaveCount(0);
    const planLine = (await page.getByTestId("billing-current-plan").innerText()).toLowerCase();
    expect(planLine.includes("plan: none")).toBeFalsy();
  });

  for (const fixture of deniedFixtures) {
    test(`${fixture.label} remains denied across dashboard/upload/reports/detail/billing after refresh + navigation`, async ({ page }) => {
      test.setTimeout(6 * 60 * 1000);
      test.skip(!fixture.email || !fixture.password, fixtureSkipReason(fixture));

      const uploadFixturePath = resolveUploadFixturePath();
      const probeReportId = getDeniedProbeReportId();
      const artifactProbeReportId = getDeniedArtifactProbeReportIdFromEnv() ?? founderGeneratedReportId;
      if (!artifactProbeReportId) {
        if (isCiRuntime()) {
          throw new Error(
            "Missing denied artifact probe report ID. Set E2E_LIFECYCLE_DENIED_ARTIFACT_REPORT_ID or run founder fixture so a report ID can be reused.",
          );
        }
        test.skip(true, "Missing denied artifact probe report ID for backend-truth artifact enforcement check.");
      }
      if (!artifactProbeReportId) {
        return;
      }

      await signInWithPassword(page, fixture);

      const bootstrapSnapshot = await captureEntitlementsSnapshot(page, () => page.reload({ waitUntil: "domcontentloaded" }));
      expect(bootstrapSnapshot.statusCode).toBe(200);
      expect(bootstrapSnapshot.accessGranted).toBe(fixture.expectedAccessGranted);
      expect(bootstrapSnapshot.billingRequired).toBe(fixture.expectedBillingRequired);
      if (fixture.expectedReasonCode) {
        expect(bootstrapSnapshot.accessReasonCode).toBe(fixture.expectedReasonCode);
      } else {
        expect(bootstrapSnapshot.accessReasonCode === null || bootstrapSnapshot.accessReasonCode === "ACTIVE_SUBSCRIPTION").toBeFalsy();
      }
      await assertDirectArtifactDenied({
        page,
        apiOrigin: bootstrapSnapshot.apiOrigin,
        reportId: artifactProbeReportId,
        fixtureLabel: fixture.label,
      });

      await expect(page.getByTestId("dashboard-action-cards-locked")).toBeVisible({ timeout: 60_000 });
      await expect(page.getByTestId("dashboard-action-cards-unlocked")).toHaveCount(0);

      const refreshSnapshot = await captureEntitlementsSnapshot(page, () => page.reload({ waitUntil: "domcontentloaded" }));
      expect(refreshSnapshot.accessGranted).toBe(false);
      expect(refreshSnapshot.billingRequired).toBe(true);
      await expect(page.getByTestId("dashboard-action-cards-locked")).toBeVisible();

      await enterUploadFlowWithFixture(page, uploadFixturePath);
      await expect(page.getByTestId("upload-entitlement-required")).toBeVisible({ timeout: 30_000 });
      await expect(page.getByRole("button", { name: /Upload & Validate/i })).toBeDisabled();
      await expect(page.getByRole("link", { name: "Go to Billing" })).toBeVisible();

      await page.goto("/app/report", { waitUntil: "domcontentloaded" });
      await assertUpgradeRedirect(page, "/app/report");
      await expect(page.getByRole("heading", { name: "Billing" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Choose Pro" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Download PDF" })).toHaveCount(0);
      await expect(page.getByTestId("report-content")).toHaveCount(0);
      await expect(page.getByTestId("report-debug-accordion")).toHaveCount(0);

      const detailPath = `/app/report/${probeReportId}`;
      await page.goto(detailPath, { waitUntil: "domcontentloaded" });
      await assertUpgradeRedirect(page, detailPath);
      await expect(page.getByTestId("report-debug-accordion")).toHaveCount(0);

      await page.goto("/app/billing", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: "Billing" })).toBeVisible();
      await expect(page.getByText("Feature access: No paid access active")).toBeVisible();
      await expect(page.getByText("Billing action is required to restore premium access.")).toBeVisible();
      await expect(page.getByRole("button", { name: "Choose Pro" })).toBeVisible();

      await page.goto("/app/data", { waitUntil: "domcontentloaded" });
      await expect(page.getByTestId("upload-entitlement-required")).toBeVisible();
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(page.getByTestId("upload-entitlement-required")).toBeVisible();

      await page.goto("/app/report", { waitUntil: "domcontentloaded" });
      await assertUpgradeRedirect(page, "/app/report");
    });
  }
});
