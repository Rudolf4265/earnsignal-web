import { expect, test } from "@playwright/test";
import { createUploadResumeRecord, getUploadResumeStorageKey } from "@/src/lib/upload/resume";
import { stubAuthenticatedSession, stubEntitlements, toApiBody, uploadFixtures } from "./test-helpers";

const uploadId = "upl_123";

async function enterUploadFlow(page: import("@playwright/test").Page) {
  await page.goto("/app/data");
  await page.getByRole("button", { name: "Patreon" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: "sample.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("email,revenue\na@example.com,123\n"),
  });
  await page.getByRole("button", { name: "Upload & Validate" }).click();
}

test.describe("Upload deep flows", () => {
  test.beforeEach(async ({ page }) => {
    await stubAuthenticatedSession(page);
    await stubEntitlements(page, "entitled");
  });

  test("free or revoked entitlement blocks report-generation CTA and shows billing upgrade guidance", async ({ page }) => {
    await page.unroute("**/v1/entitlements");
    await stubEntitlements(page, "unentitled");

    await page.goto("/app/data");
    await page.getByRole("button", { name: "Patreon" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.locator('input[type="file"]').setInputFiles({
      name: "sample.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("email,revenue\na@example.com,123\n"),
    });

    await expect(page.getByTestId("upload-entitlement-required")).toBeVisible();
    await expect(page.getByRole("button", { name: "Upload & Validate" })).toBeDisabled();
    await expect(page.getByRole("link", { name: "Go to Billing" })).toBeVisible();
  });

  test("upload CTA stays disabled while entitlement snapshot is unresolved to prevent premium-action flicker", async ({ page }) => {
    await page.unroute("**/v1/entitlements");
    await page.route("**/v1/entitlements", async (route) => {
      await page.waitForTimeout(1_200);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          effective_plan_tier: "none",
          entitlement_source: "none",
          access_granted: false,
          access_reason_code: "ENTITLEMENT_REQUIRED",
          billing_required: true,
          plan_tier: "none",
          status: "inactive",
          is_active: false,
          can_upload: true,
          can_generate_report: false,
          can_view_reports: true,
          can_download_pdf: false,
          can_access_dashboard: true,
        }),
      });
    });

    await page.goto("/app/data");
    await page.getByRole("button", { name: "Patreon" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.locator('input[type="file"]').setInputFiles({
      name: "sample.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("email,revenue\na@example.com,123\n"),
    });

    await expect(page.getByTestId("upload-entitlement-loading")).toBeVisible();
    await expect(page.getByRole("button", { name: "Checking access..." })).toBeDisabled();
    await expect(page.getByTestId("upload-entitlement-required")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole("button", { name: "Upload & Validate" })).toBeDisabled();
  });

  test("happy path: processing to report_ready", async ({ page }) => {
    let pollCount = 0;

    await page.route("**/v1/uploads/presign", async (route) => {
      const body = route.request().postDataJSON() as { checksum?: string };
      expect(body.checksum).toMatch(/^[a-f0-9]{64}$/);

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          upload_id: uploadId,
          object_key: "uploads/upl_123.csv",
          presigned_url: "https://storage.test/uploads/upl_123.csv",
          callback_url: "/v1/uploads/callback",
          callback_proof: "proof_upl_123",
        }),
      });
    });

    await page.route("https://storage.test/**", async (route) => {
      await route.fulfill({ status: 200, body: "" });
    });

    await page.route("**/v1/uploads/callback", async (route) => {
      const body = route.request().postDataJSON() as {
        upload_id: string;
        size_bytes: number;
        success: boolean;
        callback_proof: string;
      };
      expect(body.upload_id).toBe(uploadId);
      expect(body.size_bytes).toBeGreaterThan(0);
      expect(body.success).toBe(true);
      expect(body.callback_proof).toBe("proof_upl_123");

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ upload_id: uploadId, status: "processing" }),
      });
    });

    await page.route(`**/v1/uploads/${uploadId}/status`, async (route) => {
      pollCount += 1;
      const payload = pollCount === 1 ? toApiBody(uploadFixtures.processing) : toApiBody(uploadFixtures.reportReady);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(payload),
      });
    });

    await enterUploadFlow(page);

    await expect(page.getByTestId("upload-terminal-success")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("upload-view-report")).toHaveAttribute("href", "/app/report/rep_123");
  });

  test("happy path: upload flow opens generated report detail page", async ({ page }) => {
    let pollCount = 0;

    await page.route("**/v1/uploads/presign", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          upload_id: uploadId,
          object_key: "uploads/upl_123.csv",
          presigned_url: "https://storage.test/uploads/upl_123.csv",
          callback_url: "/v1/uploads/callback",
          callback_proof: "proof_upl_123",
        }),
      });
    });

    await page.route("https://storage.test/**", async (route) => {
      await route.fulfill({ status: 200, body: "" });
    });

    await page.route("**/v1/uploads/callback", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ upload_id: uploadId, status: "processing" }),
      });
    });

    await page.route(`**/v1/uploads/${uploadId}/status`, async (route) => {
      pollCount += 1;
      const payload = pollCount === 1 ? toApiBody(uploadFixtures.processing) : toApiBody(uploadFixtures.reportReady);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(payload),
      });
    });

    await page.route("**/v1/reports/rep_123", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "rep_123",
          title: "Upload Generated Report",
          status: "ready",
          summary: "Revenue trend remains healthy.",
          created_at: "2026-03-09T12:00:00Z",
          artifact_json_url: "https://artifacts.test/rep_123.json",
          artifact_url: "/v1/reports/rep_123/artifact",
        }),
      });
    });

    await page.route("https://artifacts.test/rep_123.json", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          report: {
            report_id: "rep_123",
            schema_version: "v1",
            sections: {
              executive_summary: { summary: "Revenue trend remains healthy." },
              revenue_snapshot: { net_revenue: 215000, items: ["2026-02: 215,000"] },
              stability: { stability_index: 87, items: ["Churn velocity is moderating."] },
              prioritized_insights: { items: ["Retention quality improved in Q1 cohorts."] },
              ranked_recommendations: { items: ["Increase lifecycle messaging for annual plans."] },
              outlook: { summary: "Trend remains positive in base case." },
            },
          },
        }),
      });
    });

    await enterUploadFlow(page);

    await expect(page.getByTestId("upload-terminal-success")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("upload-view-report").click();
    await expect(page).toHaveURL("/app/report/rep_123");
    await expect(page.getByTestId("report-content")).toBeVisible();
    await expect(page.getByText("Upload Generated Report")).toBeVisible();
    await expect(page.getByText("What to do next")).toBeVisible();
  });

  test("validation failure shows terminal error + retry", async ({ page }) => {
    await page.route("**/v1/uploads/presign", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ upload_id: uploadId, presigned_url: "https://storage.test/upload.csv", callback_proof: "proof_upl_123" }),
      });
    });
    await page.route("https://storage.test/**", async (route) => route.fulfill({ status: 200, body: "" }));
    await page.route("**/v1/uploads/callback", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ upload_id: uploadId, status: "processing" }) });
    });
    await page.route(`**/v1/uploads/${uploadId}/status`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(toApiBody(uploadFixtures.validationFailed)),
      });
    });

    await enterUploadFlow(page);

    await expect(page.getByTestId("upload-terminal-error")).toBeVisible();
    await expect(page.getByTestId("upload-retry")).toBeVisible();
  });

  test("session expired mid-poll shows session gate", async ({ page }) => {
    let pollCount = 0;

    await page.route("**/v1/uploads/presign", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ upload_id: uploadId, presigned_url: "https://storage.test/upload.csv", callback_proof: "proof_upl_123" }) }));
    await page.route("https://storage.test/**", async (route) => route.fulfill({ status: 200, body: "" }));
    await page.route("**/v1/uploads/callback", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ upload_id: uploadId, status: "processing" }) }));
    await page.route(`**/v1/uploads/${uploadId}/status`, async (route) => {
      pollCount += 1;
      if (pollCount === 1) {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(toApiBody(uploadFixtures.processing)) });
        return;
      }
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          status: "error",
          code: "SESSION_EXPIRED",
          message: "Session expired",
          details: { reason_code: "SESSION_EXPIRED" },
          request_id: "req_upload_expired_001",
        }),
      });
    });

    await enterUploadFlow(page);

    await expect(page.getByTestId("gate-session-expired")).toBeVisible();
  });

  test("resume flow picks up in-progress upload", async ({ page }) => {
    const resumeRecord = createUploadResumeRecord(uploadId);
    await page.addInitScript(([storageKey, record]) => {
      window.localStorage.setItem(storageKey, JSON.stringify(record));
    }, [getUploadResumeStorageKey(), resumeRecord]);

    await page.route(`**/v1/uploads/${uploadId}/status`, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(toApiBody(uploadFixtures.processing)) });
    });

    await page.goto("/app/data");

    await expect(page.getByTestId("upload-resume-banner")).toBeVisible();
    await expect(page.getByText("Processing upload")).toBeVisible();
  });

  test("stale resume marker falls back to idle and does not render processing UI when backend has no active upload", async ({ page }) => {
    const resumeRecord = createUploadResumeRecord(uploadId);
    await page.addInitScript(([storageKey, record]) => {
      window.localStorage.setItem(storageKey, JSON.stringify(record));
    }, [getUploadResumeStorageKey(), resumeRecord]);

    await page.route(`**/v1/uploads/${uploadId}/status`, async (route) => {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({
          status: "error",
          code: "UPLOAD_NOT_FOUND",
          message: "Upload not found",
          details: { reason_code: "upload_not_found" },
          request_id: "req_upload_404_001",
        }),
      });
    });
    await page.route("**/v1/uploads/latest/status", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          upload_id: "upl_ready_previous",
          status: "ready",
          report_id: "rep_ready_previous",
        }),
      });
    });

    await page.goto("/app/data");

    await expect(page.getByText("Choose platform")).toBeVisible();
    await expect(page.getByText("Processing upload")).toHaveCount(0);
    await expect(page.getByText("Checking previous upload")).toHaveCount(0);
    await expect(page.getByText("Step 1 of 5")).toBeVisible();
    await expect
      .poll(async () => page.evaluate((storageKey) => window.localStorage.getItem(storageKey), getUploadResumeStorageKey()))
      .toBeNull();
  });

  test("timeout terminal state shows retry controls", async ({ page }) => {
    await page.route("**/v1/uploads/presign", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ upload_id: uploadId, presigned_url: "https://storage.test/upload.csv", callback_proof: "proof_upl_123" }) }));
    await page.route("https://storage.test/**", async (route) => route.fulfill({ status: 200, body: "" }));
    await page.route("**/v1/uploads/callback", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ upload_id: uploadId, status: "processing" }) }));
    await page.route(`**/v1/uploads/${uploadId}/status`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          upload_id: uploadId,
          status: "timeout",
          reason_code: "timeout",
          message: "Processing timed out",
          request_id: "req_timeout_001",
        }),
      });
    });

    await enterUploadFlow(page);

    await expect(page.getByTestId("upload-terminal-error")).toBeVisible();
    await expect(page.getByTestId("upload-retry")).toBeVisible();
  });
});
