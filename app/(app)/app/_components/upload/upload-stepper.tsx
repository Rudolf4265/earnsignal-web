"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createUploadPresign,
  finalizeUploadCallback,
  getUploadStatus,
  type UploadStatusResponse,
  uploadFileToPresignedUrl,
  type UploadPlatform,
} from "@/src/lib/api/upload";
import { pollUploadStatus, UploadPollingCancelledError, UploadPollingTimeoutError } from "@/src/lib/upload/polling";
import { mapApiErrorToUploadFailure } from "@/src/lib/upload/errors";
import { buildUploadDiagnostics, isTerminalUploadStatus, mapUploadStatus, uploadStatusMessage, type UploadUiStatus, type UploadStatusView } from "@/src/lib/upload/status";
import { clearUploadResume, writeUploadResume } from "@/src/lib/upload/resume";
import { computeSHA256Hex } from "@/src/lib/upload/checksum";
import InlineAlert from "./InlineAlert";
import StepHeader from "./StepHeader";
import Stepper from "./Stepper";
import UploadCard from "./UploadCard";
import { ErrorBanner } from "@/src/components/ui/error-banner";

type Step = "platform" | "file" | "uploading" | "processing" | "done";

type PlatformOption = {
  id: UploadPlatform;
  label: string;
  supported: boolean;
};

type UploadDiagnosticsSnapshot = {
  uploadId: string | null;
  rawStatus: string | null;
  reason: string | null;
  timestamps: {
    created_at: string | null;
    validated_at: string | null;
    ingested_at: string | null;
    report_started_at: string | null;
    ready_at: string | null;
    updated_at: string | null;
  };
  monthsPresent: number | null;
  rowsWritten: number | null;
  recommendedNextAction: string | null;
};

const platforms: PlatformOption[] = [
  { id: "patreon", label: "Patreon", supported: true },
  { id: "substack", label: "Substack", supported: true },
  { id: "youtube", label: "YouTube", supported: false },
  { id: "instagram", label: "Instagram", supported: false },
  { id: "tiktok", label: "TikTok", supported: false },
  { id: "onlyfans", label: "OnlyFans", supported: false },
];

const stepOrder: Step[] = ["platform", "file", "uploading", "processing", "done"];

const primaryActionButtonClassName = "rounded-xl bg-brand-blue px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-brand-blue/90 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 disabled:cursor-not-allowed disabled:bg-brand-blue/65 disabled:text-slate-900 disabled:opacity-100";

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

export type ResumeLookupState =
  | { kind: "idle" }
  | { kind: "loading"; uploadId: string }
  | { kind: "no_upload" }
  | { kind: "in_progress"; uploadId: string; statusResponse: UploadStatusResponse; mappedStatus: UploadStatusView }
  | { kind: "finished"; uploadId: string; statusResponse: UploadStatusResponse; mappedStatus: UploadStatusView }
  | { kind: "auth_error"; uploadId: string; message: string }
  | { kind: "network_error"; uploadId: string; message: string };

type UploadStepperProps = {
  resumeLookup: ResumeLookupState;
  onRetryResumeLookup: () => Promise<void> | void;
  onClearResume: () => void;
};

export default function UploadStepper({ resumeLookup, onRetryResumeLookup, onClearResume }: UploadStepperProps) {
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
  const [errorRequestId, setErrorRequestId] = useState<string | null>(null);
  const [errorOperation, setErrorOperation] = useState<string | null>(null);
  const [isProcessingDelayed, setIsProcessingDelayed] = useState(false);
  const [diagnosticsSnapshot, setDiagnosticsSnapshot] = useState<UploadDiagnosticsSnapshot | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<UploadUiStatus | null>(null);

  const activeStepIndex = stepOrder.indexOf(step);
  const progressPct = Math.round(((activeStepIndex + 1) / stepOrder.length) * 100);
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

  const logUploadDiagnostic = useCallback((event: string, details: Record<string, unknown>) => {
    if (process.env.NODE_ENV === "production") {
      return;
    }

    console.info("[upload]", { event, ...details });
  }, []);


  const setFailureState = useCallback(
    (params: {
      uploadId: string | null;
      rawStatus: string | null;
      reasonCode: string;
      reason?: string | null;
      message: string;
      requestId?: string | null;
      operation?: string | null;
      monthsPresent?: number | null;
      rowsWritten?: number | null;
      recommendedNextAction?: string | null;
      timestamps?: UploadDiagnosticsSnapshot["timestamps"];
    }) => {
      const diagnostics: UploadDiagnosticsSnapshot = {
        uploadId: params.uploadId,
        rawStatus: params.rawStatus,
        reason: params.reason ?? params.message,
        timestamps: params.timestamps ?? {
          created_at: null,
          validated_at: null,
          ingested_at: null,
          report_started_at: null,
          ready_at: null,
          updated_at: null,
        },
        monthsPresent: params.monthsPresent ?? null,
        rowsWritten: params.rowsWritten ?? null,
        recommendedNextAction: params.recommendedNextAction ?? null,
      };

      setStep("processing");
      setProcessingStatus("failed");
      setIsProcessingDelayed(false);
      setError(friendlyFailureMessage(params.reasonCode));
      setReasonCode(params.reasonCode);
      setStatusMsg(params.message);
      setErrorRequestId(params.requestId ?? null);
      setErrorOperation(params.operation ?? null);
      setDiagnosticsSnapshot(diagnostics);
      setErrorDetails(buildUploadDiagnostics(diagnostics));
      logUploadDiagnostic("terminal_failure", {
        uploadId: params.uploadId,
        reasonCode: params.reasonCode,
        requestId: params.requestId ?? null,
        operation: params.operation ?? null,
      });
    },
    [logUploadDiagnostic],
  );

  const updateProcessingFromEnvelope = useCallback(
    (envelope: UploadStatusResponse, fallbackUploadId?: string | null) => {
      const mapped = mapUploadStatus(envelope);
      const resolvedUploadId = mapped.uploadId ?? fallbackUploadId ?? uploadId;

      setProcessingStatus(mapped.status);
      setUploadId(resolvedUploadId ?? null);
      setDiagnosticsSnapshot({
        uploadId: resolvedUploadId ?? null,
        rawStatus: mapped.rawStatus,
        reason: mapped.reason ?? mapped.message,
        timestamps: mapped.timestamps,
        monthsPresent: mapped.monthsPresent,
        rowsWritten: mapped.rowsWritten,
        recommendedNextAction: mapped.recommendedNextAction,
      });
      if (mapped.reportId) {
        setReportId(mapped.reportId);
      }

      if (mapped.status === "processing") {
        setStatusMsg(uploadStatusMessage(mapped.rawStatus));
        setStep("processing");
        setError(null);
        setReasonCode(null);
        setErrorDetails(null);
        setErrorRequestId(null);
        setErrorOperation(null);
        return;
      }

      if (mapped.status === "ready") {
        setStatusMsg("Report ready");
        setStep("done");
        setError(null);
        setReasonCode(null);
        setErrorDetails(null);
        setErrorRequestId(null);
        setErrorOperation(null);
        setIsProcessingDelayed(false);
        return;
      }

      setFailureState({
        uploadId: resolvedUploadId ?? null,
        rawStatus: mapped.rawStatus,
        reasonCode: mapped.reasonCode ?? "upload_failed",
        reason: mapped.reason,
        message: mapped.message ?? mapped.reason ?? "Processing failed.",
        monthsPresent: mapped.monthsPresent,
        rowsWritten: mapped.rowsWritten,
        recommendedNextAction: mapped.recommendedNextAction,
        timestamps: mapped.timestamps,
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
    setIsProcessingDelayed(false);
    setDiagnosticsSnapshot(null);
    setErrorRequestId(null);
    setErrorOperation(null);
    setWarnings([]);
    setBusy(false);
    setProcessingStatus(null);
    if (typeof window !== "undefined") {
      clearUploadResume(window.localStorage);
    }
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [stopPolling]);

  const copyDiagnostics = async () => {
    if (!diagnosticsSnapshot || typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }

    try {
      const diagnostics = buildUploadDiagnostics(diagnosticsSnapshot);
      await navigator.clipboard.writeText(diagnostics);
      setErrorDetails(diagnostics);
      setStatusMsg("Diagnostics copied");
    } catch {
      setStatusMsg("Unable to copy diagnostics");
    }
  };

  const handlePlatformSelect = useCallback((nextPlatform: UploadPlatform) => {
    setPlatform(nextPlatform);
    setStep("file");
    setError(null);
    setErrorDetails(null);
    setErrorRequestId(null);
    setErrorOperation(null);
    setIsProcessingDelayed(false);
  }, []);

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
                reason: status.reason ?? undefined,
                recommended_next_action: status.recommendedNextAction ?? undefined,
                rows_written: status.rowsWritten ?? undefined,
                months_present: status.monthsPresent ?? undefined,
                message: status.message ?? undefined,
                report_id: status.reportId ?? undefined,
                created_at: status.timestamps.created_at ?? undefined,
                validated_at: status.timestamps.validated_at ?? undefined,
                ingested_at: status.timestamps.ingested_at ?? undefined,
                report_started_at: status.timestamps.report_started_at ?? undefined,
                ready_at: status.timestamps.ready_at ?? undefined,
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

        if (pollError instanceof UploadPollingTimeoutError) {
          setProcessingStatus("processing");
          setStep("processing");
          setIsProcessingDelayed(true);
          setError(null);
          setReasonCode("timeout");
          setStatusMsg("Still working in the background. You can retry status at any time.");
          return;
        }

        const mapped = mapApiErrorToUploadFailure(pollError);
        setFailureState({
          uploadId: currentUploadId,
          rawStatus: null,
          reasonCode: mapped.reasonCode,
          message: mapped.message,
          requestId: mapped.requestId,
          operation: mapped.operation,
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
    setIsProcessingDelayed(false);
    setDiagnosticsSnapshot(null);
    setErrorRequestId(null);
    setErrorOperation(null);
    setWarnings([]);

    try {
      setStep("uploading");
      setStatusMsg("Preparing file…");
      const checksum = await computeSHA256Hex(file);
      console.debug("Presign checksum computed", {
        fileName: file.name,
        size: file.size,
        hasChecksum: true,
      });

      setStatusMsg("Requesting secure upload URL…");
      const presign = await createUploadPresign({
        platform,
        filename: file.name,
        content_type: file.type || "text/csv",
        size: file.size,
        checksum,
      });

      setUploadId(presign.upload_id);
      if (typeof window !== "undefined") {
        writeUploadResume(window.localStorage, presign.upload_id);
      }

      if (typeof presign.callback_proof === "undefined") {
        throw new Error("Upload finalize failed: missing callback proof from presign response");
      }

      try {
        setStatusMsg("Uploading file…");
        await uploadFileToPresignedUrl({
          presignedUrl: presign.presigned_url,
          file,
          headers: presign.headers,
        });
      } catch (storageUploadError) {
        await finalizeUploadCallback(
          {
            upload_id: presign.upload_id,
            success: false,
            size_bytes: file.size,
            callback_proof: presign.callback_proof,
            platform,
            object_key: presign.object_key,
            filename: file.name,
            content_type: file.type || "text/csv",
          },
          presign.callback_url,
        );
        throw storageUploadError;
      }

      setStatusMsg("Finalizing upload…");
      const callback = await finalizeUploadCallback(
        {
          upload_id: presign.upload_id,
          success: true,
          size_bytes: file.size,
          callback_proof: presign.callback_proof,
          platform,
          object_key: presign.object_key,
          filename: file.name,
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
        requestId: mapped.requestId,
        operation: mapped.operation,
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
    setIsProcessingDelayed(false);

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


  // Resume policy: only auto-resume polling for non-terminal uploads from the one-time lookup.
  useEffect(() => {
    if (resumeLookup.kind !== "in_progress" || isTerminalUploadStatus(resumeLookup.mappedStatus.status) || busy || step !== "platform") {
      return;
    }

    setStep("processing");
    setStatusMsg("Checking previous upload…");
    updateProcessingFromEnvelope(resumeLookup.statusResponse, resumeLookup.uploadId);
    void pollUntilTerminal(resumeLookup.uploadId);
  }, [busy, pollUntilTerminal, resumeLookup, step, updateProcessingFromEnvelope]);


  return (
    <UploadCard className="space-y-6">
      <Stepper steps={steps} activeIndex={activeStepIndex} />

      {error ? (
        <ErrorBanner data-testid="upload-terminal-error"
          title="Upload needs attention"
          message={error}
          requestId={errorRequestId ?? undefined}
          retryLabel="Retry status"
          onRetry={uploadId && !busy ? () => void retryProcessing() : undefined}
          action={
            <>
              <button
                type="button"
                data-testid="upload-reset"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
                onClick={resetFlow}
              >
                Start over
              </button>
              <button
                type="button"
                data-testid="upload-copy-diagnostics"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
                onClick={copyDiagnostics}
                disabled={!errorDetails}
              >
                Copy diagnostics
              </button>
            </>
          }
        >
          <div className="space-y-2">
            {reasonCode ? <p className="text-xs text-red-100/80">Reason code: {reasonCode}</p> : null}
            {errorOperation ? <p className="text-xs text-red-100/80">Operation: {errorOperation}</p> : null}
            {reasonCode === "session_expired" ? (
              <Link href="/login" className="inline-flex rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100">
                Log in again
              </Link>
            ) : null}
          </div>
        </ErrorBanner>
      ) : null}

      {isProcessingDelayed ? (
        <InlineAlert variant="info" title="Still working">
          <div className="space-y-3 text-sm text-slate-700">
            <p>Your upload is still processing on the API service. You can retry status, copy diagnostics, or start over.</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                data-testid="upload-retry-status"
                onClick={() => void retryProcessing()}
                disabled={!uploadId || busy}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Retry status
              </button>
              <button
                type="button"
                data-testid="upload-copy-diagnostics-timeout"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
                onClick={copyDiagnostics}
                disabled={!diagnosticsSnapshot}
              >
                Copy diagnostics
              </button>
              <button
                type="button"
                data-testid="upload-start-over-timeout"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
                onClick={resetFlow}
              >
                Start over
              </button>
            </div>
          </div>
        </InlineAlert>
      ) : null}

      {resumeLookup.kind === "finished" && step === "platform" ? (
        <InlineAlert variant="info" title="Last upload finished" data-testid="upload-last-finished">
          <div className="space-y-3 text-sm text-slate-700">
            <p>
              Status: <span className="font-medium">{resumeLookup.mappedStatus.status === "ready" ? "Ready" : "Failed"}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {resumeLookup.mappedStatus.reportId ? (
                <Link
                  href={`/app/report/${resumeLookup.mappedStatus.reportId}`}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
                >
                  View report
                </Link>
              ) : null}
              <button
                type="button"
                data-testid="upload-start-new"
                onClick={resetFlow}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
              >
                Start new upload
              </button>
              <button
                type="button"
                data-testid="upload-clear-last"
                onClick={() => {
                  onClearResume();
                  resetFlow();
                }}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
              >
                Clear
              </button>
            </div>
          </div>
        </InlineAlert>
      ) : null}

      {resumeLookup.kind === "auth_error" && step === "platform" ? (
        <InlineAlert variant="warn" title="Session expired" data-testid="upload-resume-auth-error">
          <div className="space-y-3 text-sm text-slate-700">
            <p>Your session expired while checking your last upload.</p>
            <Link href="/login" className="inline-flex rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100">
              Log in again
            </Link>
          </div>
        </InlineAlert>
      ) : null}

      {resumeLookup.kind === "network_error" && step === "platform" ? (
        <InlineAlert variant="warn" title="Couldn't check last upload" data-testid="upload-resume-network-error">
          <div className="space-y-3 text-sm text-slate-700">
            <p>{resumeLookup.message}</p>
            <button
              type="button"
              onClick={() => void onRetryResumeLookup()}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
            >
              Retry
            </button>
          </div>
        </InlineAlert>
      ) : null}



      <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Step {activeStepIndex + 1} of {stepOrder.length}</span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-gradient-to-r from-brand-blue to-emerald-400 transition-all" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

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
          {uploadId ? null : resumeLookup.kind === "in_progress" ? (
            <InlineAlert variant="info" title="Found an in-progress upload" data-testid="upload-resume-banner">
              We found a recent upload and are resuming status checks.
            </InlineAlert>
          ) : null}
          <StepHeader title="Choose platform" subtitle="Select the data source for this upload." />
          <div className="grid gap-3 sm:grid-cols-2">
            {platforms.map((item) => {
              const selected = platform === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={!item.supported}
                  onClick={() => handlePlatformSelect(item.id)}
                  className={`rounded-2xl border border-slate-200 bg-white p-4 text-left transition ${
                    item.supported ? "cursor-pointer hover:bg-slate-100" : "cursor-not-allowed opacity-60"
                  } ${selected ? "border-brand-blue " : ""}`}
                >
                  <p className="font-medium text-slate-900">{item.label}</p>
                  <p className="mt-1 text-xs text-slate-600">{item.supported ? "Available" : "Coming soon"}</p>
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
                setErrorRequestId(null);
                setErrorOperation(null);
              }}
              className={primaryActionButtonClassName}
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
            className="w-full rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center hover:border-brand-blue/60 hover:bg-slate-100"
            onClick={() => inputRef.current?.click()}
          >
            <p className="text-sm font-medium text-slate-900">Click to choose a file</p>
            <p className="mt-1 text-xs text-slate-600">Drag and drop is supported by your browser as well.</p>
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
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <p className="font-medium text-slate-900">{file.name}</p>
              <p className="text-xs text-slate-600">Size: {readableFileSize(file.size)}</p>
              <p className="text-xs text-slate-600">Last modified: {new Date(file.lastModified).toLocaleString()}</p>
            </div>
          ) : null}

          {unsupportedCsvWarning ? (
            <InlineAlert variant="warn" title="This file may not be CSV">
              We recommend uploading a .csv file. You can still continue and let backend validation confirm.
            </InlineAlert>
          ) : null}

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Need help? Ask your platform for a CSV export.</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep("platform")}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!platform || !file || busy}
                onClick={runUpload}
                className={primaryActionButtonClassName}
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
                  : "Most uploads complete within 45–90 seconds. Keep this tab open while we validate your data."
            }
          />
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
            {(step === "uploading" || busy) && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-500 border-t-transparent" />
            )}
            <p className="text-sm text-slate-700">{statusMsg ?? "Working…"}</p>
          </div>
          <div className="flex gap-2">
            {error ? (
              <button
                type="button"
                data-testid="upload-retry"
                onClick={() => void retryProcessing()}
                disabled={!uploadId || busy}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Retry status
              </button>
            ) : null}
            <button
              type="button"
              data-testid="upload-reset"
              onClick={resetFlow}
              className="cursor-pointer rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-100"
            >
              Start over
            </button>
          </div>
        </div>
      ) : null}

      {step === "done" ? (
        <div className="space-y-5">
          <InlineAlert variant="success" title="Report ready" data-testid="upload-terminal-success">
            Your upload was validated and your report is now available.
          </InlineAlert>
          <div className="flex flex-wrap gap-2">
            <Link
              href={reportId ? `/app/report/${reportId}` : "/app/report"}
              data-testid="upload-view-report"
              className="rounded-xl bg-brand-blue px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-brand-blue/90 hover:text-slate-950"
            >
              View report
            </Link>
            <button
              type="button"
              onClick={resetFlow}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              Upload another
            </button>
          </div>
          <p className="text-xs text-slate-500">Upload ID: {uploadId ?? "n/a"}</p>
        </div>
      ) : null}

      {step !== "done" && step !== "uploading" && step !== "processing" ? (
        <div className="flex justify-end">
          <div className="flex gap-2">
            {error ? (
              <button
                type="button"
                data-testid="upload-retry"
                onClick={() => void retryProcessing()}
                disabled={!uploadId || busy}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Retry status
              </button>
            ) : null}
            <button
              type="button"
              data-testid="upload-reset"
              onClick={resetFlow}
              className="cursor-pointer rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-100"
            >
              Start over
            </button>
          </div>
        </div>
      ) : null}
    </UploadCard>
  );
}
