"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createUploadPresign,
  finalizeUploadCallback,
  getLatestUploadStatus,
  getUploadStatus,
  type UploadStatusResponse,
  uploadFileToPresignedUrl,
  type UploadPlatform,
} from "@/src/lib/api/upload";
import { pollUploadStatus, UploadPollingCancelledError } from "@/src/lib/upload/polling";
import { mapApiErrorToUploadFailure } from "@/src/lib/upload/errors";
import { buildUploadDiagnostics, mapUploadStatus, type UploadUiStatus } from "@/src/lib/upload/status";
import InlineAlert from "./InlineAlert";
import StepHeader from "./StepHeader";
import Stepper from "./Stepper";
import UploadCard from "./UploadCard";

type Step = "platform" | "file" | "uploading" | "processing" | "done";

type PlatformOption = {
  id: UploadPlatform;
  label: string;
  supported: boolean;
};

const LAST_UPLOAD_ID_KEY = "earnsignal:last_upload_id";

const platforms: PlatformOption[] = [
  { id: "patreon", label: "Patreon", supported: true },
  { id: "substack", label: "Substack", supported: true },
  { id: "youtube", label: "YouTube", supported: false },
  { id: "instagram", label: "Instagram", supported: false },
  { id: "tiktok", label: "TikTok", supported: false },
  { id: "onlyfans", label: "OnlyFans", supported: false },
];

const stepOrder: Step[] = ["platform", "file", "uploading", "processing", "done"];

const readableFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const friendlyFailureMessage = (reasonCode: string | null) => {
  switch (reasonCode) {
    case "validation_failed":
      return "We couldn’t validate that CSV. Please export a fresh file and try again.";
    case "ingest_failed":
      return "We couldn’t ingest the file right now. Please retry in a moment.";
    case "report_failed":
      return "The upload succeeded, but report generation failed. Please retry.";
    case "session_expired":
      return "Your session expired while checking upload status. Please log in again.";
    case "upload_not_found":
      return "We couldn’t find that previous upload anymore. Please reset and upload again.";
    case "timeout":
      return "This upload is still processing and timed out in the dashboard. You can retry status checks or reset.";
    default:
      return "We couldn’t complete processing for this upload yet.";
  }
};

function readStoredUploadId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LAST_UPLOAD_ID_KEY);
}

function storeUploadId(uploadId: string | null) {
  if (typeof window === "undefined") return;
  if (!uploadId) {
    window.localStorage.removeItem(LAST_UPLOAD_ID_KEY);
    return;
  }

  window.localStorage.setItem(LAST_UPLOAD_ID_KEY, uploadId);
}

export default function UploadStepper() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pollAbortRef = useRef<AbortController | null>(null);

  const [step, setStep] = useState<Step>("platform");
  const [platform, setPlatform] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reasonCode, setReasonCode] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<UploadUiStatus | null>(null);

  const activeStepIndex = stepOrder.indexOf(step);
  const steps = useMemo(
    () => [
      { id: "platform", label: "Platform" },
      { id: "file", label: "File" },
      { id: "upload", label: "Upload" },
      { id: "processing", label: "Processing" },
      { id: "done", label: "Done" },
    ],
    [],
  );

  const unsupportedCsvWarning = file && !file.name.toLowerCase().endsWith(".csv");

  const stopPolling = useCallback(() => {
    pollAbortRef.current?.abort();
    pollAbortRef.current = null;
  }, []);

  const setFailureState = useCallback(
    (params: { uploadId: string | null; rawStatus: string | null; reasonCode: string; message: string; updatedAt?: string | null }) => {
      setStep("processing");
      setProcessingStatus("failed");
      setError(friendlyFailureMessage(params.reasonCode));
      setReasonCode(params.reasonCode);
      setStatusMsg(params.message);
      setErrorDetails(
        buildUploadDiagnostics({
          uploadId: params.uploadId,
          rawStatus: params.rawStatus,
          reasonCode: params.reasonCode,
          message: params.message,
          updatedAt: params.updatedAt,
        }),
      );
    },
    [],
  );

  const updateProcessingFromEnvelope = useCallback(
    (envelope: UploadStatusResponse, fallbackUploadId?: string | null) => {
      const mapped = mapUploadStatus(envelope);
      const resolvedUploadId = mapped.uploadId ?? fallbackUploadId ?? uploadId;

      setProcessingStatus(mapped.status);
      setUploadId(resolvedUploadId ?? null);
      if (mapped.reportId) {
        setReportId(mapped.reportId);
      }

      if (mapped.status === "processing") {
        setStatusMsg("Processing upload…");
        setStep("processing");
        setError(null);
        setReasonCode(null);
        setErrorDetails(null);
        return;
      }

      if (mapped.status === "ready") {
        setStatusMsg("Report ready");
        setStep("done");
        setError(null);
        setReasonCode(null);
        setErrorDetails(null);
        return;
      }

      setFailureState({
        uploadId: resolvedUploadId ?? null,
        rawStatus: mapped.rawStatus,
        reasonCode: mapped.reasonCode ?? "upload_failed",
        message: mapped.message ?? "Processing failed.",
        updatedAt: mapped.updatedAt,
      });
    },
    [setFailureState, uploadId],
  );

  const resetFlow = useCallback(() => {
    stopPolling();
    setStep("platform");
    setPlatform(null);
    setFile(null);
    setUploadId(null);
    setReportId(null);
    setStatusMsg(null);
    setError(null);
    setReasonCode(null);
    setErrorDetails(null);
    setWarnings([]);
    setBusy(false);
    setProcessingStatus(null);
    storeUploadId(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [stopPolling]);

  const copyDiagnostics = async () => {
    if (!errorDetails || typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(errorDetails);
      setStatusMsg("Diagnostics copied");
    } catch {
      setStatusMsg("Unable to copy diagnostics");
    }
  };

  const pollUntilTerminal = useCallback(
    async (currentUploadId: string) => {
      stopPolling();
      const controller = new AbortController();
      pollAbortRef.current = controller;

      try {
        await pollUploadStatus({
          signal: controller.signal,
          getStatus: async () => mapUploadStatus(await getUploadStatus(currentUploadId)),
          onUpdate: (status) => {
            updateProcessingFromEnvelope(
              {
                upload_id: status.uploadId ?? currentUploadId,
                status: status.rawStatus ?? status.status,
                reason_code: status.reasonCode ?? undefined,
                message: status.message ?? undefined,
                report_id: status.reportId ?? undefined,
                updated_at: status.updatedAt ?? undefined,
              },
              currentUploadId,
            );
          },
        });
      } catch (pollError) {
        if (pollError instanceof UploadPollingCancelledError) {
          return;
        }

        if (pollError instanceof Error && /timed out/i.test(pollError.message)) {
          setFailureState({
            uploadId: currentUploadId,
            rawStatus: "processing",
            reasonCode: "timeout",
            message: "Upload is still processing. Retry status check in a moment.",
          });
          return;
        }

        const mapped = mapApiErrorToUploadFailure(pollError);
        setFailureState({
          uploadId: currentUploadId,
          rawStatus: null,
          reasonCode: mapped.reasonCode,
          message: mapped.message,
        });
        if (mapped.shouldStopPolling) {
          stopPolling();
        }
      } finally {
        if (pollAbortRef.current === controller) {
          pollAbortRef.current = null;
        }
      }
    },
    [setFailureState, stopPolling, updateProcessingFromEnvelope],
  );

  const runUpload = async () => {
    if (!platform || !file || busy) {
      return;
    }

    stopPolling();
    setBusy(true);
    setError(null);
    setReasonCode(null);
    setErrorDetails(null);
    setWarnings([]);

    try {
      setStep("uploading");
      setStatusMsg("Requesting secure upload URL…");

      const presign = await createUploadPresign({
        platform,
        filename: file.name,
        content_type: file.type || "text/csv",
        size: file.size,
      });

      setUploadId(presign.upload_id);
      storeUploadId(presign.upload_id);

      setStatusMsg("Uploading file…");
      await uploadFileToPresignedUrl({
        presignedUrl: presign.presigned_url,
        file,
        headers: presign.headers,
      });

      setStatusMsg("Finalizing upload…");
      const callback = await finalizeUploadCallback(
        {
          upload_id: presign.upload_id,
          platform,
          object_key: presign.object_key,
          filename: file.name,
          size: file.size,
          content_type: file.type || "text/csv",
        },
        presign.callback_url,
      );

      if (callback.warnings?.length) {
        setWarnings(callback.warnings);
      }

      setStep("processing");
      setStatusMsg("Processing upload…");
      await pollUntilTerminal(presign.upload_id);
    } catch (uploadError) {
      const mapped = mapApiErrorToUploadFailure(uploadError);
      setFailureState({
        uploadId,
        rawStatus: null,
        reasonCode: mapped.reasonCode,
        message: mapped.message,
      });
    } finally {
      setBusy(false);
    }
  };

  const retryProcessing = async () => {
    if (!uploadId || busy) {
      return;
    }

    setBusy(true);
    setError(null);
    setReasonCode(null);
    setStatusMsg("Retrying status check…");

    try {
      await pollUntilTerminal(uploadId);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  useEffect(() => {
    const resumeUploadId = readStoredUploadId();
    if (!resumeUploadId || busy || step !== "platform") {
      return;
    }

    let active = true;

    const hydrateStatus = async () => {
      setBusy(true);
      setStep("processing");
      setStatusMsg("Checking previous upload…");

      try {
        const byId = await getUploadStatus(resumeUploadId);
        if (!active) {
          return;
        }

        updateProcessingFromEnvelope(byId, resumeUploadId);

        const mapped = mapUploadStatus(byId);
        if (mapped.status === "processing") {
          await pollUntilTerminal(resumeUploadId);
        }
      } catch (resumeError) {
        if (!active) {
          return;
        }

        const mapped = mapApiErrorToUploadFailure(resumeError);

        if (mapped.reasonCode === "upload_not_found") {
          try {
            const latest = await getLatestUploadStatus();
            if (!active) return;
            const latestMapped = mapUploadStatus(latest);
            updateProcessingFromEnvelope(latest, latestMapped.uploadId ?? resumeUploadId);
            if (latestMapped.status === "processing" && latestMapped.uploadId) {
              await pollUntilTerminal(latestMapped.uploadId);
              return;
            }
          } catch {
            // fall through to not-found UI
          }
        }

        setFailureState({
          uploadId: resumeUploadId,
          rawStatus: null,
          reasonCode: mapped.reasonCode,
          message: mapped.message,
        });
      } finally {
        if (active) {
          setBusy(false);
        }
      }
    };

    void hydrateStatus();

    return () => {
      active = false;
    };
  }, [busy, pollUntilTerminal, setFailureState, step, updateProcessingFromEnvelope]);

  return (
    <UploadCard className="space-y-6 shadow-brandGlow">
      <Stepper steps={steps} activeIndex={activeStepIndex} />

      {error ? (
        <InlineAlert variant="error" title={error}>
          <div className="space-y-2">
            {reasonCode ? <p className="text-xs text-red-100/80">Reason code: {reasonCode}</p> : null}
            {reasonCode === "session_expired" ? (
              <Link href="/login" className="inline-flex rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/15">
                Log in again
              </Link>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/15"
                onClick={retryProcessing}
                disabled={!uploadId || busy}
              >
                Try again
              </button>
              <button
                type="button"
                className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-gray-100 hover:bg-white/5"
                onClick={resetFlow}
              >
                Reset
              </button>
              <button
                type="button"
                className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-gray-100 hover:bg-white/5"
                onClick={copyDiagnostics}
                disabled={!errorDetails}
              >
                Copy diagnostics
              </button>
            </div>
          </div>
        </InlineAlert>
      ) : null}

      {warnings.length > 0 ? (
        <InlineAlert variant="warn" title="Limited data quality detected">
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </InlineAlert>
      ) : null}

      {step === "platform" ? (
        <div className="space-y-5">
          <StepHeader title="Choose platform" subtitle="Select the data source for this upload." />
          <div className="grid gap-3 sm:grid-cols-2">
            {platforms.map((item) => {
              const selected = platform === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={!item.supported}
                  onClick={() => setPlatform(item.id)}
                  className={`rounded-2xl border border-white/10 bg-navy-950 p-4 text-left transition ${
                    item.supported ? "hover:bg-white/5" : "cursor-not-allowed opacity-60"
                  } ${selected ? "border-brand-blue shadow-brandGlow" : ""}`}
                >
                  <p className="font-medium text-white">{item.label}</p>
                  <p className="mt-1 text-xs text-gray-400">{item.supported ? "Available" : "Coming soon"}</p>
                </button>
              );
            })}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={!platform}
              onClick={() => {
                setStep("file");
                setError(null);
                setErrorDetails(null);
              }}
              className="rounded-xl bg-brand-blue px-4 py-2 text-sm font-semibold text-white shadow-brandGlow transition hover:bg-brand-blue/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Continue
            </button>
          </div>
        </div>
      ) : null}

      {step === "file" ? (
        <div className="space-y-5">
          <StepHeader title="Select file" subtitle="Upload a CSV export from your platform." />
          <button
            type="button"
            className="w-full rounded-2xl border border-dashed border-white/20 bg-navy-950 px-5 py-8 text-center hover:border-brand-blue/60 hover:bg-white/5"
            onClick={() => inputRef.current?.click()}
          >
            <p className="text-sm font-medium text-white">Click to choose a file</p>
            <p className="mt-1 text-xs text-gray-400">Drag and drop is supported by your browser as well.</p>
          </button>

          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => {
              const selectedFile = event.target.files?.[0] ?? null;
              setFile(selectedFile);
            }}
          />

          {file ? (
            <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-gray-200">
              <p className="font-medium text-white">{file.name}</p>
              <p className="text-xs text-gray-400">Size: {readableFileSize(file.size)}</p>
              <p className="text-xs text-gray-400">Last modified: {new Date(file.lastModified).toLocaleString()}</p>
            </div>
          ) : null}

          {unsupportedCsvWarning ? (
            <InlineAlert variant="warn" title="This file may not be CSV">
              We recommend uploading a .csv file. You can still continue and let backend validation confirm.
            </InlineAlert>
          ) : null}

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Need help? Ask your platform for a CSV export.</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep("platform")}
                className="rounded-xl border border-white/15 px-4 py-2 text-sm text-gray-200 hover:bg-white/5"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!platform || !file || busy}
                onClick={runUpload}
                className="rounded-xl bg-brand-blue px-4 py-2 text-sm font-semibold text-white shadow-brandGlow hover:bg-brand-blue/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Upload &amp; Validate
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {step === "uploading" || step === "processing" ? (
        <div className="space-y-4">
          <StepHeader
            title={step === "uploading" ? "Uploading file" : "Processing upload"}
            subtitle={
              step === "uploading"
                ? "We’re sending your file securely."
                : processingStatus === "failed"
                  ? "Processing did not finish successfully."
                  : "This usually takes under a minute."
            }
          />
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-navy-950 px-4 py-3">
            {(step === "uploading" || busy) && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            <p className="text-sm text-gray-200">{statusMsg ?? "Working…"}</p>
          </div>
          <button
            type="button"
            onClick={resetFlow}
            className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5"
          >
            Start over
          </button>
        </div>
      ) : null}

      {step === "done" ? (
        <div className="space-y-5">
          <InlineAlert variant="success" title="Report ready">
            Your upload was validated and your report is now available.
          </InlineAlert>
          <div className="flex flex-wrap gap-2">
            <Link
              href={reportId ? `/app/report/${reportId}` : "/app/report"}
              className="rounded-xl bg-brand-blue px-4 py-2 text-sm font-semibold text-white shadow-brandGlow hover:bg-brand-blue/90"
            >
              View report
            </Link>
            <button
              type="button"
              onClick={resetFlow}
              className="rounded-xl border border-white/20 px-4 py-2 text-sm text-gray-100 hover:bg-white/5"
            >
              Upload another
            </button>
          </div>
          <p className="text-xs text-gray-500">Upload ID: {uploadId ?? "n/a"}</p>
        </div>
      ) : null}

      {step !== "done" && step !== "uploading" && step !== "processing" ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={resetFlow}
            className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5"
          >
            Start over
          </button>
        </div>
      ) : null}
    </UploadCard>
  );
}
