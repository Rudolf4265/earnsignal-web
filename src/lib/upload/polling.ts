import { isTerminalUploadStatus, type UploadStatusView } from "./status";

export type UploadPollConfig = {
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

export class UploadPollingTimeoutError extends Error {
  constructor(message = "Upload processing timed out.") {
    super(message);
    this.name = "UploadPollingTimeoutError";
  }
}

export const defaultUploadPollConfig: Required<UploadPollConfig> = {
  timeoutMs: 300_000,
};

export function nextUploadPollInterval(elapsedMs: number): number {
  if (elapsedMs < 20_000) {
    return 2_000;
  }

  if (elapsedMs < 90_000) {
    return 5_000;
  }

  return 10_000;
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

  while (true) {
    throwIfAborted(signal);

    const status = await getStatus();
    onUpdate?.(status);

    if (isTerminalUploadStatus(status.status)) {
      return status;
    }

    const elapsedMs = Date.now() - startedAt;
    if (elapsedMs >= config.timeoutMs) {
      throw new UploadPollingTimeoutError();
    }

    await sleep(nextUploadPollInterval(elapsedMs), signal);
  }
}
