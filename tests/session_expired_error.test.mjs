import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const apiClientModuleUrl = pathToFileURL(path.resolve("src/lib/api/client.ts")).href;
const helperModuleUrl = pathToFileURL(path.resolve("src/lib/auth/isSessionExpiredError.ts")).href;

test("isSessionExpiredError treats 401 without code as expired", async () => {
  const [{ ApiError }, { isSessionExpiredError }] = await Promise.all([
    import(`${apiClientModuleUrl}?t=${Date.now()}-api-401`),
    import(`${helperModuleUrl}?t=${Date.now()}-helper-401`),
  ]);

  const error = new ApiError({
    status: 401,
    code: "HTTP_401",
    message: "Unauthorized",
    operation: "entitlements.fetch",
    path: "/v1/entitlements",
    method: "GET",
  });

  assert.equal(isSessionExpiredError(error, { hasAuthContext: true }), true);
});

test("isSessionExpiredError treats 403 with auth context as expired", async () => {
  const [{ ApiError }, { isSessionExpiredError }] = await Promise.all([
    import(`${apiClientModuleUrl}?t=${Date.now()}-api-403`),
    import(`${helperModuleUrl}?t=${Date.now()}-helper-403`),
  ]);

  const error = new ApiError({
    status: 403,
    code: "FORBIDDEN",
    message: "Forbidden",
    operation: "entitlements.fetch",
    path: "/v1/entitlements",
    method: "GET",
  });

  assert.equal(isSessionExpiredError(error, { hasAuthContext: true }), true);
  assert.equal(isSessionExpiredError(error), false);
});
