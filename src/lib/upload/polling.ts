import { isTerminalUploadStatus, type UploadStatusView } from "./status.ts";

export type UploadPollConfig = {
  initialIntervalMs?: number;
  maxIntervalMs?: number;
  timeoutMs?: number;
};

export type PollUploadStatusParams = {
  getStatus: () => Promise<UploadStatusView>;
  config?: UploadPollConfig;
  onUpdate?: (status: UploadStatusView) => void;
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
  signal?: AbortSignal;
};

export class UploadPollingCancelledError extends Error {
  constructor() {
    super("Upload polling was cancelled.");
    this.name = "UploadPollingCancelledError";
  }
}

export const defaultUploadPollConfig: Required<UploadPollConfig> = {
  initialIntervalMs: 1_000,
  maxIntervalMs: 2_000,
  timeoutMs: 180_000,
};

export function nextUploadPollInterval(currentMs: number, maxMs: number): number {
  return Math.min(maxMs, currentMs + 250);
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new UploadPollingCancelledError();
  }
}

function sleepWithAbort(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      reject(new UploadPollingCancelledError());
    };

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export async function pollUploadStatus(params: PollUploadStatusParams): Promise<UploadStatusView> {
  const { getStatus, onUpdate, signal } = params;
  const sleep = params.sleep ?? sleepWithAbort;
  const config = { ...defaultUploadPollConfig, ...(params.config ?? {}) };

  const startedAt = Date.now();
  let intervalMs = config.initialIntervalMs;

  while (true) {
    throwIfAborted(signal);

    const status = await getStatus();
    onUpdate?.(status);

    if (isTerminalUploadStatus(status.status)) {
      return status;
    }

    if (Date.now() - startedAt >= config.timeoutMs) {
      throw new Error("Upload processing timed out. Please retry the upload.");
    }

    await sleep(intervalMs, signal);
    intervalMs = nextUploadPollInterval(intervalMs, config.maxIntervalMs);
  }
}
