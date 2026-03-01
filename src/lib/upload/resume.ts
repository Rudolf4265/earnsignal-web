const LAST_UPLOAD_ID_KEY = "earnsignal:last_upload_id";
const DEFAULT_APP_VERSION = "v1";
export const UPLOAD_RESUME_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type StoredUploadResume = {
  uploadId: string;
  createdAt: string;
  appVersion: string;
};

function getCurrentAppVersion(): string {
  const configured = process.env.NEXT_PUBLIC_APP_VERSION?.trim();
  return configured && configured.length > 0 ? configured : DEFAULT_APP_VERSION;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toStoredUploadResume(value: unknown): StoredUploadResume | null {
  if (!isRecord(value)) {
    return null;
  }

  const uploadId = value.uploadId;
  const createdAt = value.createdAt;
  const appVersion = value.appVersion;

  if (typeof uploadId !== "string" || uploadId.trim().length === 0) {
    return null;
  }

  if (typeof createdAt !== "string" || Number.isNaN(Date.parse(createdAt))) {
    return null;
  }

  if (typeof appVersion !== "string" || appVersion.trim().length === 0) {
    return null;
  }

  return { uploadId, createdAt, appVersion };
}

export function getUploadResumeStorageKey(): string {
  return LAST_UPLOAD_ID_KEY;
}

export function createUploadResumeRecord(uploadId: string, now = new Date()): StoredUploadResume {
  return {
    uploadId,
    createdAt: now.toISOString(),
    appVersion: getCurrentAppVersion(),
  };
}

export function readUploadResume(storage: Pick<Storage, "getItem" | "setItem" | "removeItem">, now = new Date()): StoredUploadResume | null {
  const raw = storage.getItem(LAST_UPLOAD_ID_KEY);
  if (!raw) {
    return null;
  }

  const currentVersion = getCurrentAppVersion();

  if (!raw.trim().startsWith("{")) {
    const legacyUploadId = raw.trim();
    if (!legacyUploadId) {
      storage.removeItem(LAST_UPLOAD_ID_KEY);
      return null;
    }

    const migrated = createUploadResumeRecord(legacyUploadId, now);
    storage.setItem(LAST_UPLOAD_ID_KEY, JSON.stringify(migrated));
    return migrated;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    const record = toStoredUploadResume(parsed);
    if (!record) {
      storage.removeItem(LAST_UPLOAD_ID_KEY);
      return null;
    }

    if (record.appVersion !== currentVersion) {
      storage.removeItem(LAST_UPLOAD_ID_KEY);
      return null;
    }

    const createdAtMs = Date.parse(record.createdAt);
    if (now.getTime() - createdAtMs > UPLOAD_RESUME_TTL_MS) {
      storage.removeItem(LAST_UPLOAD_ID_KEY);
      return null;
    }

    return record;
  } catch {
    storage.removeItem(LAST_UPLOAD_ID_KEY);
    return null;
  }
}

export function writeUploadResume(storage: Pick<Storage, "setItem" | "removeItem">, uploadId: string | null, now = new Date()): void {
  if (!uploadId) {
    storage.removeItem(LAST_UPLOAD_ID_KEY);
    return;
  }

  const record = createUploadResumeRecord(uploadId, now);
  storage.setItem(LAST_UPLOAD_ID_KEY, JSON.stringify(record));
}

export function clearUploadResume(storage: Pick<Storage, "removeItem">): void {
  storage.removeItem(LAST_UPLOAD_ID_KEY);
}
