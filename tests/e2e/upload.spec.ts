import { expect, test } from "@playwright/test";
import { createUploadResumeRecord, getUploadResumeStorageKey } from "@/src/lib/upload/resume";
import { stubAuthenticatedSession, stubEntitlements, toApiBody, uploadFixtures } from "./test-helpers";

const uploadId = "upl_123";

async function enterUploadFlow(page: import("@playwright/test").Page) {
  await page.goto("/app/data");
  await page.getByRole("button", { name: "Patreon" }).click();
  await expect(page.getByText("Select file")).toBeVisible();
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

  test("platform click advances and start over resets to platform step", async ({ page }) => {
    await page.goto("/app/data");

    const patreonCard = page.getByRole("button", { name: "Patreon Available" });
    await expect(patreonCard).toBeVisible();
    await patreonCard.click();

    await expect(page.getByText("Select file")).toBeVisible();

    const startOver = page.getByTestId("upload-reset").first();
    await expect(startOver).toBeVisible();
    await startOver.click();

    await expect(page.getByText("Choose platform")).toBeVisible();
    await expect(page.getByRole("button", { name: "Patreon Available" })).toBeVisible();
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

    await expect(page.getByTestId("upload-terminal-success")).toBeVisible();
    await expect(page.getByTestId("upload-view-report")).toHaveAttribute("href", "/app/report/rep_123");
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

  test("resume 404 clears key and returns to start flow", async ({ page }) => {
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
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({
          status: "error",
          code: "UPLOAD_NOT_FOUND",
          message: "Upload not found",
          details: { reason_code: "upload_not_found" },
          request_id: "req_upload_latest_404_001",
        }),
      });
    });

    await page.goto("/app/data");

    await expect(page.getByText("Choose platform")).toBeVisible();
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
