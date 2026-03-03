import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { readFile, writeFile, mkdir } from "node:fs/promises";

const sourcePath = path.resolve("src/lib/upload/polling.ts");
const tempDir = path.resolve(".tmp-tests");
const tempPath = path.join(tempDir, `polling-${Date.now()}.ts`);

await mkdir(tempDir, { recursive: true });
const rewritten = (await readFile(sourcePath, "utf8")).replace('from "./status"', 'from "../src/lib/upload/status"');
await writeFile(tempPath, rewritten, "utf8");

const pollingModuleUrl = pathToFileURL(tempPath).href;

const { pollUploadStatus, nextUploadPollInterval, UploadPollingCancelledError, UploadPollingTimeoutError } = await import(`${pollingModuleUrl}?t=${Date.now()}`);

test("nextUploadPollInterval uses staged backoff", () => {
  assert.equal(nextUploadPollInterval(0), 2000);
  assert.equal(nextUploadPollInterval(19999), 2000);
  assert.equal(nextUploadPollInterval(20000), 5000);
  assert.equal(nextUploadPollInterval(89999), 5000);
  assert.equal(nextUploadPollInterval(90000), 10000);
});

test("pollUploadStatus resolves once status becomes ready", async () => {
  const queue = [
    { status: "processing", uploadId: "u1", reasonCode: null, reason: null, message: null, reportId: null, rawStatus: "processing", updatedAt: null, recommendedNextAction: null, monthsPresent: null, rowsWritten: null, timestamps: { created_at: null, validated_at: null, ingested_at: null, report_started_at: null, ready_at: null, updated_at: null } },
    { status: "ready", uploadId: "u1", reasonCode: null, reason: null, message: null, reportId: "r1", rawStatus: "ready", updatedAt: null, recommendedNextAction: null, monthsPresent: null, rowsWritten: null, timestamps: { created_at: null, validated_at: null, ingested_at: null, report_started_at: null, ready_at: null, updated_at: null } },
  ];

  const seen = [];
  const result = await pollUploadStatus({
    getStatus: async () => queue.shift(),
    onUpdate: (value) => seen.push(value.status),
    sleep: async () => {},
    config: { timeoutMs: 5000 },
  });

  assert.equal(result.status, "ready");
  assert.deepEqual(seen, ["processing", "ready"]);
});

test("pollUploadStatus throws typed timeout", async () => {
  await assert.rejects(
    pollUploadStatus({
      getStatus: async () => ({
        status: "processing",
        uploadId: "u-timeout",
        reasonCode: null,
        reason: null,
        message: null,
        reportId: null,
        rawStatus: "processing",
        updatedAt: null,
        recommendedNextAction: null,
        monthsPresent: null,
        rowsWritten: null,
        timestamps: { created_at: null, validated_at: null, ingested_at: null, report_started_at: null, ready_at: null, updated_at: null },
      }),
      sleep: async () => {},
      config: { timeoutMs: 0 },
    }),
    UploadPollingTimeoutError,
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
        reason: null,
        message: null,
        reportId: null,
        rawStatus: "processing",
        updatedAt: null,
        recommendedNextAction: null,
        monthsPresent: null,
        rowsWritten: null,
        timestamps: { created_at: null, validated_at: null, ingested_at: null, report_started_at: null, ready_at: null, updated_at: null },
      }),
      sleep: async (_ms, signal) => {
        controller.abort();
        if (signal?.aborted) {
          throw new UploadPollingCancelledError();
        }
      },
      config: { timeoutMs: 1000 },
    }),
    /cancelled/i,
  );
});
