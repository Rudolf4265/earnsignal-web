"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createUploadPresign,
  finalizeUploadCallback,
  getLatestUploadStatus,
  getUploadStatus,
  uploadFileToPresignedUrl,
  type UploadPlatform,
} from "@/src/lib/api/upload";
import { pollUploadStatus, UploadPollingCancelledError } from "@/src/lib/upload/polling";
import { mapApiErrorToUploadFailure } from "@/src/lib/upload/errors";
import { buildUploadDiagnostics, mapUploadStatus, type UploadStatusEnvelope, type UploadUiStatus } from "@/src/lib/upload/status";
import { clearUploadResume, readUploadResume, writeUploadResume } from "@/src/lib/upload/resume";
import { computeSHA256Hex } from "@/src/lib/upload/checksum";
import {
  DIRECT_FAN_PLATFORM_CARD_ID,
  DIRECT_FAN_PLATFORMS,
  groupPlatformCards,
  resolveDirectFanBackendId,
  UPLOAD_PLATFORM_CARDS,
} from "@/src/lib/upload/platform-metadata";
import { getSupportedRevenueUploadSummary } from "@/src/lib/upload/platform-guidance";
import { buildReportDetailPathOrIndex } from "@/src/lib/report/path";
import { useEntitlementState } from "../../../_components/use-entitlement-state";
import InlineAlert from "./InlineAlert";
import StepHeader from "./StepHeader";
import Stepper from "./Stepper";
import UploadCard from "./UploadCard";
import { ErrorBanner } from "@/src/components/ui/error-banner";

type Step = "platform" | "file" | "uploading" | "processing" | "done";

const stepOrder: Step[] = ["platform", "file", "uploading", "processing", "done"];
const RESUME_STATUS_TIMEOUT_MS = 2_500;
const platformSections = groupPlatformCards(UPLOAD_PLATFORM_CARDS);
const supportedRevenueUploads = getSupportedRevenueUploadSummary();
const directFanBackendIds = new Set(
  DIRECT_FAN_PLATFORMS.map((item) => item.backendId).filter((id): id is UploadPlatform => id !== null),
);

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
    case "entitlement_required":
      return "Paid report generation requires Report or Pro access. Upgrade in Billing to continue.";
    default:
      return "We couldn’t complete processing for this upload yet.";
  }
};

type PlatformCardProps = {
  label: string;
  subtitle: string;
  icon: string;
  available: boolean;
  selected: boolean;
  onClick: () => void;
  testId?: string;
};

function PlatformCard({ label, subtitle, icon, available, selected, onClick, testId }: PlatformCardProps) {
  const statusLabel = available ? "Available" : "Coming soon";

  return (
    <button
      type="button"
      data-testid={testId}
      disabled={!available}
      onClick={onClick}
      className={`group flex h-full w-full flex-col rounded-2xl border bg-white p-4 text-left transition-all duration-200 ${
        available
          ? "cursor-pointer border-slate-200 shadow-[0_8px_24px_-22px_rgba(15,23,42,0.45)] hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-[0_14px_28px_-18px_rgba(14,116,144,0.4)]"
          : "cursor-not-allowed border-slate-200 opacity-65"
      } ${selected ? "border-brand-blue shadow-[0_0_0_1px_rgba(37,99,235,0.45),0_14px_30px_-18px_rgba(37,99,235,0.35)]" : ""}`}
    >
      <Image
        src={icon}
        alt={`${label} logo`}
        width={28}
        height={28}
        className="platform-icon block h-[28px] w-[28px] object-contain"
      />
      <p className="mt-3 text-sm font-semibold text-slate-900">{label}</p>
      <p className="mt-1 text-xs text-slate-600">{subtitle}</p>
      <span
        className={`mt-4 inline-flex w-fit rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
          available ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-500"
        }`}
      >
        {statusLabel}
      </span>
    </button>
  );
}

async function awaitWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<{ timedOut: boolean; value: T | null }> {
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<{ type: "timeout" }>((resolve) => {
    timeoutHandle = setTimeout(() => resolve({ type: "timeout" }), timeoutMs);
  });

  const guardedPromise = promise
    .then((value) => ({ type: "resolved" as const, value }))
    .catch((error) => ({ type: "rejected" as const, error }));

  const outcome = await Promise.race([guardedPromise, timeoutPromise]);
  if (timeoutHandle !== null) {
    clearTimeout(timeoutHandle);
  }

  if (outcome.type === "timeout") {
    return { timedOut: true, value: null };
  }

  if (outcome.type === "rejected") {
    throw outcome.error;
  }

  return { timedOut: false, value: outcome.value };
}

export default function UploadStepper() {
  const entitlementState = useEntitlementState();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pollAbortRef = useRef<AbortController | null>(null);

  const [step, setStep] = useState<Step>("platform");
  const [platform, setPlatform] = useState<UploadPlatform | null>(null);
  const [directFanExpanded, setDirectFanExpanded] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reasonCode, setReasonCode] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [errorRequestId, setErrorRequestId] = useState<string | null>(null);
  const [errorOperation, setErrorOperation] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<UploadUiStatus | null>(null);
  const [hasResumeCandidate, setHasResumeCandidate] = useState(false);

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
  const uploadReady =
    Boolean(platform && file) &&
    !busy &&
    !entitlementState.loading &&
    entitlementState.canUpload &&
    entitlementState.canValidateUpload;
  const reportAccessBlocked = !entitlementState.loading && !entitlementState.canGenerateReport;
  const directFanSelected = platform ? directFanBackendIds.has(platform) : false;

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
      message: string;
      updatedAt?: string | null;
      requestId?: string | null;
      operation?: string | null;
    }) => {
      setStep("processing");
      setProcessingStatus("failed");
      setError(friendlyFailureMessage(params.reasonCode));
      setReasonCode(params.reasonCode);
      setStatusMsg(params.message);
      setErrorRequestId(params.requestId ?? null);
      setErrorOperation(params.operation ?? null);
      setErrorDetails(
        buildUploadDiagnostics({
          uploadId: params.uploadId,
          rawStatus: params.rawStatus,
          reasonCode: params.reasonCode,
          message: params.message,
          updatedAt: params.updatedAt,
          requestId: params.requestId,
          operation: params.operation,
        }),
      );
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
    (envelope: UploadStatusEnvelope, fallbackUploadId?: string | null) => {
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
        setErrorRequestId(null);
        setErrorOperation(null);
        return;
      }

      if (mapped.status === "validated") {
        setStatusMsg(mapped.message ?? "Upload validated. Upgrade to Report or Pro to generate a paid report.");
        setStep("done");
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
    setDirectFanExpanded(false);
    setFile(null);
    setUploadId(null);
    setReportId(null);
    setStatusMsg(null);
    setError(null);
    setReasonCode(null);
    setErrorDetails(null);
    setErrorRequestId(null);
    setErrorOperation(null);
    setWarnings([]);
    setBusy(false);
    setProcessingStatus(null);
    setHasResumeCandidate(false);
    if (typeof window !== "undefined") {
      clearUploadResume(window.localStorage);
    }
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [stopPolling]);

  const clearResumeCandidateState = useCallback(() => {
    if (typeof window !== "undefined") {
      clearUploadResume(window.localStorage);
    }
    setHasResumeCandidate(false);
    setStatusMsg(null);
    setProcessingStatus(null);
    setUploadId(null);
    setReportId(null);
    setError(null);
    setReasonCode(null);
    setErrorDetails(null);
    setErrorRequestId(null);
    setErrorOperation(null);
    setStep("platform");
  }, []);

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
            operation: "uploads.status",
          });
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

  const resumeIfBackendActive = useCallback(
    async (statusEnvelope: UploadStatusEnvelope, fallbackUploadId: string): Promise<boolean> => {
      const mapped = mapUploadStatus(statusEnvelope);
      const activeUploadId = mapped.uploadId ?? fallbackUploadId;

      if (!activeUploadId) {
        return false;
      }

      setHasResumeCandidate(false);
      updateProcessingFromEnvelope(statusEnvelope, activeUploadId);
      if (mapped.status === "processing") {
        await pollUntilTerminal(activeUploadId);
      }
      return true;
    },
    [pollUntilTerminal, updateProcessingFromEnvelope],
  );

  const runUpload = async () => {
    if (!platform || !file || busy || entitlementState.loading) {
      return;
    }

    if (!entitlementState.canUpload || !entitlementState.canValidateUpload) {
      setFailureState({
        uploadId,
        rawStatus: null,
        reasonCode: "entitlement_required",
        message: "Upload validation is unavailable for this account.",
        operation: "uploads.presign",
      });
      return;
    }

    stopPolling();
    setBusy(true);
    setError(null);
    setReasonCode(null);
    setErrorDetails(null);
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

      const callbackStatus = mapUploadStatus({
        upload_id: presign.upload_id,
        status: callback.status,
      });
      if (callbackStatus.status !== "processing") {
        updateProcessingFromEnvelope(
          {
            upload_id: presign.upload_id,
            status: callback.status,
          },
          presign.upload_id,
        );
        return;
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
    const resumeRecord = typeof window !== "undefined" ? readUploadResume(window.localStorage) : null;
    const resumeUploadId = resumeRecord?.uploadId ?? null;
    setHasResumeCandidate(Boolean(resumeUploadId));
    if (!resumeUploadId || step !== "platform" || uploadId) {
      return;
    }

    let active = true;

    const hydrateStatus = async () => {
      try {
        const byIdResult = await awaitWithTimeout(getUploadStatus(resumeUploadId), RESUME_STATUS_TIMEOUT_MS);
        if (!active) {
          return;
        }

        if (!byIdResult.timedOut && byIdResult.value) {
          const resumedFromById = await resumeIfBackendActive(byIdResult.value, resumeUploadId);
          if (!active || resumedFromById) {
            return;
          }

          clearResumeCandidateState();
          return;
        }
      } catch (resumeError) {
        if (!active) {
          return;
        }

        const mapped = mapApiErrorToUploadFailure(resumeError);
        if (mapped.reasonCode !== "upload_not_found") {
          clearResumeCandidateState();
          return;
        }
      }

      try {
        const latestResult = await awaitWithTimeout(getLatestUploadStatus(), RESUME_STATUS_TIMEOUT_MS);
        if (!active) {
          return;
        }

        if (!latestResult.timedOut && latestResult.value) {
          const latestMapped = mapUploadStatus(latestResult.value);
          const resumedFromLatest = await resumeIfBackendActive(latestResult.value, latestMapped.uploadId ?? resumeUploadId);
          if (!active || resumedFromLatest) {
            return;
          }
        }
      } catch {
        // Fall back to idle state if reconciliation cannot confirm an active upload.
      }

      if (active) {
        clearResumeCandidateState();
      }
    };

    void hydrateStatus();

    return () => {
      active = false;
    };
  }, [clearResumeCandidateState, resumeIfBackendActive, step, uploadId]);

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
                Reset
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
            {reasonCode === "entitlement_required" ? (
              <Link href="/app/billing" className="inline-flex rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100">
                Go to Billing
              </Link>
            ) : null}
          </div>
        </ErrorBanner>
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

      {entitlementState.loading ? (
        <InlineAlert variant="info" title="Checking plan access" data-testid="upload-entitlement-loading">
          Validating your entitlement before report generation is enabled.
        </InlineAlert>
      ) : null}

      {reportAccessBlocked ? (
        <InlineAlert variant="warn" title="Upgrade required for report generation" data-testid="upload-entitlement-required">
          <p className="mb-2 text-sm text-amber-100/90">
            Free includes upload validation only. Upgrade to Report or Pro to generate a paid report.
            {entitlementState.accessReasonCode ? ` (${entitlementState.accessReasonCode})` : ""}
          </p>
          <Link href="/app/billing" className="inline-flex rounded-lg border border-amber-200/60 px-3 py-1.5 text-xs text-amber-100 hover:bg-amber-300/10">
            Go to Billing
          </Link>
        </InlineAlert>
      ) : null}

      {step === "platform" ? (
        <div className="space-y-5">
          {uploadId ? null : hasResumeCandidate ? (
            <InlineAlert variant="info" title="Found an in-progress upload" data-testid="upload-resume-banner">
              We found a recent upload and will automatically check its status.
            </InlineAlert>
          ) : null}
          <StepHeader title="Choose platform" subtitle="Select the data source for this upload." />
          <InlineAlert variant="info" title="Start with currently supported revenue exports" data-testid="upload-platform-guide">
            <p>Today, the guided upload flow accepts {supportedRevenueUploads}. Choose the platform that matches your export, then continue with a fresh CSV file.</p>
            <p className="mt-2">Earn unlocks first from revenue and subscriber data. Grow is the audience and engagement side, and richer scorecards appear when supported analytics are available.</p>
            <Link href="/app/help#upload-guide" className="mt-3 inline-flex rounded-lg border border-blue-200/60 px-3 py-1.5 text-xs text-blue-100 hover:bg-blue-300/10">
              Open upload guide
            </Link>
          </InlineAlert>
          <div className="space-y-4">
            {platformSections.map((section) => (
              <section key={section.category} className="space-y-2" data-testid={`platform-section-${section.category}`}>
                <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{section.label}</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {section.items.map((item) => {
                    if (item.id === DIRECT_FAN_PLATFORM_CARD_ID) {
                      return (
                        <PlatformCard
                          key={item.id}
                          label={item.label}
                          subtitle={item.subtitle}
                          icon={item.icon}
                          available={item.available}
                          selected={directFanExpanded || directFanSelected}
                          onClick={() => setDirectFanExpanded((value) => !value)}
                          testId={`platform-card-${item.id}`}
                        />
                      );
                    }

                    const selected = platform === item.id;
                    return (
                      <PlatformCard
                        key={item.id}
                        label={item.label}
                        subtitle={item.subtitle}
                        icon={item.icon}
                        available={item.available}
                        selected={selected}
                        onClick={() => {
                          if (!item.available) {
                            return;
                          }
                          setPlatform(item.id);
                          setDirectFanExpanded(false);
                        }}
                        testId={`platform-card-${item.id}`}
                      />
                    );
                  })}
                </div>

                {section.category === "additional" ? (
                  <div
                    data-testid="direct-fan-reveal"
                    className="overflow-hidden transition-[max-height] duration-200 ease-out"
                    style={{ maxHeight: directFanExpanded ? "560px" : "0px" }}
                    aria-hidden={!directFanExpanded}
                  >
                    <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                      <p className="text-sm font-semibold text-slate-900">Choose your platform</p>
                      <p className="mt-1 text-xs text-slate-600">Select the platform that matches your creator revenue export.</p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        {DIRECT_FAN_PLATFORMS.map((item) => {
                          const backendId = resolveDirectFanBackendId(item.id);
                          const selectable = item.available && Boolean(backendId);
                          const selected = Boolean(backendId && platform === backendId);

                          return (
                            <PlatformCard
                              key={item.id}
                              label={item.label}
                              subtitle={item.subtitle}
                              icon={item.icon}
                              available={selectable}
                              selected={selected}
                              onClick={() => {
                                if (!selectable || !backendId) {
                                  return;
                                }
                                setPlatform(backendId);
                                setDirectFanExpanded(false);
                              }}
                              testId={`direct-fan-option-${item.id}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : null}
              </section>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={!platform}
              onClick={() => {
                setStep("file");
                setDirectFanExpanded(false);
                setError(null);
                setErrorDetails(null);
                setErrorRequestId(null);
                setErrorOperation(null);
              }}
              className="rounded-xl bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-blue/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Continue
            </button>
          </div>
        </div>
      ) : null}

      {step === "file" ? (
        <div className="space-y-5">
          <StepHeader title="Select file" subtitle="Upload a CSV export from your platform." />
          <InlineAlert variant="info" title="What happens after upload" data-testid="upload-file-guide">
            <p>Accepted file type: CSV. EarnSigma validates the file first, then keeps processing until a report is ready when your plan includes report generation.</p>
            <p className="mt-2">If validation fails, export a fresh CSV from your platform and retry. If processing stalls, retry status before starting over.</p>
            <Link href="/app/help#after-upload" className="mt-3 inline-flex rounded-lg border border-blue-200/60 px-3 py-1.5 text-xs text-blue-100 hover:bg-blue-300/10">
              Review upload help
            </Link>
          </InlineAlert>
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
                disabled={!uploadReady}
                onClick={runUpload}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  uploadReady
                    ? "border-emerald-300/70 bg-brand-blue shadow-[0_0_0_3px_rgba(16,185,129,0.18)] hover:bg-brand-blue/90 hover:shadow-[0_0_0_4px_rgba(16,185,129,0.22)]"
                    : "border-transparent bg-brand-blue hover:bg-brand-blue/90"
                }`}
              >
                {entitlementState.loading ? "Checking access..." : "Upload & Validate"}
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
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-100"
            >
              Start over
            </button>
          </div>
        </div>
      ) : null}

      {step === "done" ? (
        <div className="space-y-5">
          {processingStatus === "validated" ? (
            <>
              <InlineAlert variant="info" title="Upload validated" data-testid="upload-terminal-validated">
                Your file passed validation. Upgrade to Report or Pro to generate a paid report from this upload.
              </InlineAlert>
              <div className="flex flex-wrap gap-2">
                <Link href="/app/billing" className="rounded-xl bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue/90">
                  Unlock report
                </Link>
                <button
                  type="button"
                  onClick={resetFlow}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  Upload another
                </button>
              </div>
            </>
          ) : (
            <>
              <InlineAlert variant="success" title="Report ready" data-testid="upload-terminal-success">
                Your upload was validated and your report is now available.
              </InlineAlert>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={buildReportDetailPathOrIndex(reportId)}
                  data-testid="upload-view-report"
                  className="rounded-xl bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue/90"
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
            </>
          )}
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
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-100"
            >
              Start over
            </button>
          </div>
        </div>
      ) : null}
    </UploadCard>
  );
}

