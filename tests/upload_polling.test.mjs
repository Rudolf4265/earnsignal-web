import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { readFile, writeFile, mkdir } from "node:fs/promises";

const sourcePath = path.resolve("src/lib/upload/polling.ts");
const tempDir = path.resolve(".tmp-tests");
const tempPath = path.join(tempDir, `polling-${Date.now()}.ts`);

await mkdir(tempDir, { recursive: true });
const rewritten = (await readFile(sourcePath, "utf8")).replace('from "./status"', 'from "../src/lib/upload/status.ts"');
await writeFile(tempPath, rewritten, "utf8");

const pollingModuleUrl = pathToFileURL(tempPath).href;

const { pollUploadStatus, nextUploadPollInterval, UploadPollingCancelledError } = await import(`${pollingModuleUrl}?t=${Date.now()}`);

test("nextUploadPollInterval increases with cap", () => {
  assert.equal(nextUploadPollInterval(1000, 2000), 1250);
  assert.equal(nextUploadPollInterval(1900, 2000), 2000);
  assert.equal(nextUploadPollInterval(2000, 2000), 2000);
});

test("pollUploadStatus resolves once status becomes ready", async () => {
  const queue = [
    { status: "processing", uploadId: "u1", reasonCode: null, message: null, reportId: null, rawStatus: "processing", updatedAt: null },
    { status: "ready", uploadId: "u1", reasonCode: null, message: null, reportId: "r1", rawStatus: "ready", updatedAt: null },
  ];

  const seen = [];
  const result = await pollUploadStatus({
    getStatus: async () => queue.shift(),
    onUpdate: (value) => seen.push(value.status),
    sleep: async () => {},
    config: { timeoutMs: 5000, initialIntervalMs: 1, maxIntervalMs: 2 },
  });

  assert.equal(result.status, "ready");
  assert.deepEqual(seen, ["processing", "ready"]);
});

test("pollUploadStatus throws on timeout", async () => {
  await assert.rejects(
    pollUploadStatus({
      getStatus: async () => ({
        status: "processing",
        uploadId: "u-timeout",
        reasonCode: null,
        message: null,
        reportId: null,
        rawStatus: "processing",
        updatedAt: null,
      }),
      sleep: async () => {},
      config: { timeoutMs: 0, initialIntervalMs: 1, maxIntervalMs: 1 },
    }),
    /timed out/i,
  );
});

test("pollUploadStatus cancels via AbortController", async () => {
  const controller = new AbortController();

  await assert.rejects(
    pollUploadStatus({
      signal: controller.signal,
      getStatus: async () => ({
        status: "processing",
        uploadId: "u-cancel",
        reasonCode: null,
        message: null,
        reportId: null,
        rawStatus: "processing",
        updatedAt: null,
      }),
      sleep: async (_ms, signal) => {
        controller.abort();
        if (signal?.aborted) {
          throw new UploadPollingCancelledError();
        }
      },
      config: { timeoutMs: 1000, initialIntervalMs: 1, maxIntervalMs: 1 },
    }),
    /cancelled/i,
  );
});
