import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { readFile, writeFile, mkdir } from "node:fs/promises";

const uploadSourcePath = path.resolve("src/lib/api/upload.ts");
const errorModuleUrl = pathToFileURL(path.resolve("src/lib/upload/errors.ts")).href;

const source = await readFile(uploadSourcePath, "utf8");
const patched = source.replace("./client", "../src/lib/api/client.ts");
await mkdir(path.resolve(".tmp-tests"), { recursive: true });
const uploadTempPath = path.resolve(".tmp-tests", `upload-errors-${Date.now()}.ts`);
await writeFile(uploadTempPath, patched, "utf8");
const apiModuleUrl = pathToFileURL(uploadTempPath).href;
const { ApiError } = await import(`${apiModuleUrl}?t=${Date.now()}`);
const { mapApiErrorToUploadFailure } = await import(`${errorModuleUrl}?t=${Date.now()}`);

test("mapApiErrorToUploadFailure handles auth expiration without redirect", () => {
  const unauthorized = mapApiErrorToUploadFailure(new ApiError({ status: 401, code: "HTTP_401", message: "Unauthorized", operation: "test", path: "/x", method: "GET" }));
  const forbidden = mapApiErrorToUploadFailure(new ApiError({ status: 403, code: "HTTP_403", message: "Forbidden", operation: "test", path: "/x", method: "GET" }));

  assert.equal(unauthorized.reasonCode, "session_expired");
  assert.equal(unauthorized.shouldStopPolling, true);
  assert.equal(forbidden.reasonCode, "session_expired");
  assert.equal(forbidden.shouldStopPolling, true);
});

test("mapApiErrorToUploadFailure maps not-found to recoverable state", () => {
  const notFound = mapApiErrorToUploadFailure(new ApiError({ status: 404, code: "HTTP_404", message: "missing", operation: "test", path: "/x", method: "GET" }));

  assert.equal(notFound.reasonCode, "upload_not_found");
  assert.equal(notFound.shouldStopPolling, true);
});

test("mapApiErrorToUploadFailure keeps unknown errors retryable", () => {
  const result = mapApiErrorToUploadFailure(new Error("network unstable"));

  assert.equal(result.reasonCode, "upload_failed");
  assert.equal(result.shouldStopPolling, false);
});
