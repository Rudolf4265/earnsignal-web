import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("request id rendering stays explicit on shared error surfaces without leaking into upload's primary error box", async () => {
  const report = await readFile("app/(app)/app/report/[id]/page.tsx", "utf8");
  const billing = await readFile("app/(app)/app/billing/page.tsx", "utf8");
  const upload = await readFile("app/(app)/app/_components/upload/upload-stepper.tsx", "utf8");
  const adminList = await readFile("app/(app)/app/admin/page.tsx", "utf8");
  const adminDetail = await readFile("app/(app)/app/admin/users/[creatorId]/page.tsx", "utf8");
  const errorBanner = await readFile("src/components/ui/error-banner.tsx", "utf8");

  assert.equal(report.includes("requestId={state.requestId}"), true);
  assert.equal(billing.includes("requestId={errorRequestId}"), true);
  assert.equal(upload.includes("requestId={errorRequestId ?? undefined}"), false);
  assert.equal(upload.includes("buildUploadDiagnostics"), true);
  assert.equal(adminList.includes("requestId={error.requestId}"), true);
  assert.equal(adminDetail.includes("requestId={error.requestId}"), true);
  assert.equal(errorBanner.includes('data-testid="error-request-id"'), true);
});
