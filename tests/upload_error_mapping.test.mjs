import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const apiModuleUrl = pathToFileURL(path.resolve("src/lib/api/upload.ts")).href;
const errorModuleUrl = pathToFileURL(path.resolve("src/lib/upload/errors.ts")).href;

const { ApiError } = await import(`${apiModuleUrl}?t=${Date.now()}`);
const { mapApiErrorToUploadFailure } = await import(`${errorModuleUrl}?t=${Date.now()}`);

test("mapApiErrorToUploadFailure handles auth expiration without redirect", () => {
  const unauthorized = mapApiErrorToUploadFailure(new ApiError("Unauthorized", 401));
  const forbidden = mapApiErrorToUploadFailure(new ApiError("Forbidden", 403));

  assert.equal(unauthorized.reasonCode, "session_expired");
  assert.equal(unauthorized.shouldStopPolling, true);
  assert.equal(forbidden.reasonCode, "session_expired");
  assert.equal(forbidden.shouldStopPolling, true);
});

test("mapApiErrorToUploadFailure maps not-found to recoverable state", () => {
  const notFound = mapApiErrorToUploadFailure(new ApiError("missing", 404));

  assert.equal(notFound.reasonCode, "upload_not_found");
  assert.equal(notFound.shouldStopPolling, true);
});

test("mapApiErrorToUploadFailure keeps unknown errors retryable", () => {
  const result = mapApiErrorToUploadFailure(new Error("network unstable"));

  assert.equal(result.reasonCode, "upload_failed");
  assert.equal(result.shouldStopPolling, false);
});
