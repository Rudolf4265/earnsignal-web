import { expect, test } from "@playwright/test";
import { getUploadResumeStorageKey } from "@/src/lib/upload/resume";
import { stubAuthenticatedSession } from "./test-helpers";

type TraceEntry = {
  method: string;
  url: string;
  pathname: string;
  page: string;
};

test.describe("Request trace scaffolding", () => {
  test("captures API requests for /app/data, /app/report, /app", async ({ page }, testInfo) => {
    await stubAuthenticatedSession(page);

    const uploadResumeStorageKey = getUploadResumeStorageKey();
    await page.addInitScript((key) => {
      window.localStorage.removeItem(key);
      window.sessionStorage.clear();
    }, uploadResumeStorageKey);

    const trace: TraceEntry[] = [];
    let currentPage = "unknown";

    await page.route("**/v1/**", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      trace.push({
        method: request.method(),
        url: request.url(),
        pathname: url.pathname,
        page: currentPage,
      });

      if (url.pathname === "/v1/entitlements") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            plan: "pro",
            status: "active",
            entitled: true,
            features: { app: true, upload: true, report: true },
            request_id: "req_trace_entitlements",
          }),
        });
        return;
      }

      if (url.pathname === "/v1/uploads/latest/status") {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({
            code: "UPLOAD_NOT_FOUND",
            message: "Upload not found",
            details: { reason_code: "upload_not_found" },
            request_id: "req_trace_latest_not_found",
          }),
        });
        return;
      }

      if (/^\/v1\/uploads\/[^/]+\/status$/.test(url.pathname)) {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({
            code: "UPLOAD_NOT_FOUND",
            message: "Upload not found",
            details: { reason_code: "upload_not_found" },
            request_id: "req_trace_by_id_not_found",
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, request_id: "req_trace_default" }),
      });
    });

    currentPage = "/app/data";
    await page.goto("/app/data");
    await expect(page.getByText("Choose platform")).toBeVisible();

    currentPage = "/app/report";
    await page.goto("/app/report");
    await expect(page.getByRole("heading", { name: "Reports" })).toBeVisible();

    currentPage = "/app";
    await page.goto("/app");
    await expect(page.getByTestId("nav-dashboard")).toBeVisible();

    const tracePayload = {
      generatedAt: new Date().toISOString(),
      pagesVisited: ["/app/data", "/app/report", "/app"],
      requests: trace,
      todo: [
        "PR1: assert endpoint inventory by page (including method/path counts).",
        "PR2: assert report listing/read contracts once backend list endpoint is confirmed.",
        "PR3: assert upload resume/status and dashboard-summary request expectations.",
      ],
    };

    console.log("[request-trace]", JSON.stringify(tracePayload, null, 2));

    await testInfo.attach("request-trace.json", {
      contentType: "application/json",
      body: Buffer.from(JSON.stringify(tracePayload, null, 2)),
    });

    expect(trace.length).toBeGreaterThan(0);
  });
});
