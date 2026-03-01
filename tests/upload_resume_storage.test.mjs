import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

process.env.NEXT_PUBLIC_APP_VERSION = "test-version";

const resumeModuleUrl = pathToFileURL(path.resolve("src/lib/upload/resume.ts")).href;
const { readUploadResume, writeUploadResume, getUploadResumeStorageKey, UPLOAD_RESUME_TTL_MS } = await import(
  `${resumeModuleUrl}?t=${Date.now()}`
);

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, value),
    removeItem: (key) => map.delete(key),
  };
}

test("readUploadResume migrates legacy upload id string", () => {
  const storage = createMemoryStorage();
  const key = getUploadResumeStorageKey();
  storage.setItem(key, "up_legacy");

  const now = new Date("2026-01-01T00:00:00.000Z");
  const record = readUploadResume(storage, now);

  assert.equal(record?.uploadId, "up_legacy");
  assert.equal(record?.appVersion, "test-version");
  assert.equal(record?.createdAt, now.toISOString());

  const persisted = JSON.parse(storage.getItem(key));
  assert.equal(persisted.uploadId, "up_legacy");
  assert.equal(persisted.appVersion, "test-version");
});

test("readUploadResume clears expired resume record", () => {
  const storage = createMemoryStorage();
  const key = getUploadResumeStorageKey();
  const createdAt = new Date("2026-01-01T00:00:00.000Z");

  writeUploadResume(storage, "up_expired", createdAt);

  const expiredNow = new Date(createdAt.getTime() + UPLOAD_RESUME_TTL_MS + 1);
  const record = readUploadResume(storage, expiredNow);

  assert.equal(record, null);
  assert.equal(storage.getItem(key), null);
});

test("readUploadResume clears version-mismatched record", () => {
  const storage = createMemoryStorage();
  const key = getUploadResumeStorageKey();
  storage.setItem(
    key,
    JSON.stringify({
      uploadId: "up_old",
      createdAt: "2026-01-01T00:00:00.000Z",
      appVersion: "old-version",
    }),
  );

  const record = readUploadResume(storage, new Date("2026-01-02T00:00:00.000Z"));
  assert.equal(record, null);
  assert.equal(storage.getItem(key), null);
});
