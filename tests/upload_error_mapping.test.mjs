import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { readFile, writeFile, mkdir } from "node:fs/promises";

const uploadSourcePath = path.resolve("src/lib/api/upload.ts");
const errorModuleUrl = pathToFileURL(path.resolve("src/lib/upload/errors.ts")).href;

const source = await readFile(uploadSourcePath, "utf8");
const patched = source.replace("./client", "../src/lib/api/client");
await mkdir(path.resolve(".tmp-tests"), { recursive: true });
const uploadTempPath = path.resolve(".tmp-tests", `upload-errors-${Date.now()}.ts`);
await writeFile(uploadTempPath, patched, "utf8");
const apiModuleUrl = pathToFileURL(uploadTempPath).href;
const { ApiError } = await import(`${apiModuleUrl}?t=${Date.now()}`);
const { mapApiErrorToUploadFailure } = await import(`${errorModuleUrl}?t=${Date.now()}`);

test("mapApiErrorToUploadFailure handles auth expiration with request metadata", () => {
  const unauthorized = mapApiErrorToUploadFailure(
    new ApiError({
      status: 401,
      code: "HTTP_401",
      message: "Unauthorized",
      operation: "uploads.status",
      path: "/x",
      method: "GET",
      requestId: "req_401",
    }),
  );

  assert.equal(unauthorized.reasonCode, "session_expired");
  assert.equal(unauthorized.shouldStopPolling, true);
  assert.equal(unauthorized.requestId, "req_401");
  assert.equal(unauthorized.operation, "uploads.status");
});

test("mapApiErrorToUploadFailure maps not-found to recoverable state", () => {
  const notFound = mapApiErrorToUploadFailure(
    new ApiError({ status: 404, code: "HTTP_404", message: "missing", operation: "test", path: "/x", method: "GET" }),
  );

  assert.equal(notFound.reasonCode, "upload_not_found");
  assert.equal(notFound.shouldStopPolling, true);
});

test("mapApiErrorToUploadFailure maps ENTITLEMENT_REQUIRED to upgrade-required state", () => {
  const entitlementRequired = mapApiErrorToUploadFailure(
    new ApiError({
      status: 403,
      code: "ENTITLEMENT_REQUIRED",
      message: "Upgrade required",
      operation: "reports.generate",
      path: "/v1/reports",
      method: "POST",
      requestId: "req_entitlement_required_001",
    }),
  );

  assert.equal(entitlementRequired.reasonCode, "entitlement_required");
  assert.equal(entitlementRequired.shouldStopPolling, true);
  assert.equal(entitlementRequired.requestId, "req_entitlement_required_001");
  assert.equal(entitlementRequired.operation, "reports.generate");
});

test("mapApiErrorToUploadFailure keeps unknown errors retryable", () => {
  const result = mapApiErrorToUploadFailure(new Error("network unstable"));

  assert.equal(result.reasonCode, "upload_failed");
  assert.equal(result.shouldStopPolling, false);
  assert.equal(result.requestId, null);
});
