"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  createUploadPresign,
  finalizeUploadCallback,
  generateReport,
  uploadFileToPresignedUrl,
  type UploadPlatform,
} from "@/src/lib/api/upload";
import InlineAlert from "./InlineAlert";
import StepHeader from "./StepHeader";
import Stepper from "./Stepper";
import UploadCard from "./UploadCard";

type Step = "platform" | "file" | "uploading" | "generating" | "done";

type PlatformOption = {
  id: UploadPlatform;
  label: string;
  supported: boolean;
};

const platforms: PlatformOption[] = [
  { id: "patreon", label: "Patreon", supported: true },
  { id: "substack", label: "Substack", supported: true },
  { id: "youtube", label: "YouTube", supported: false },
  { id: "instagram", label: "Instagram", supported: false },
  { id: "tiktok", label: "TikTok", supported: false },
  { id: "onlyfans", label: "OnlyFans", supported: false },
];

const stepOrder: Step[] = ["platform", "file", "uploading", "generating", "done"];

const readableFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export default function UploadStepper() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [step, setStep] = useState<Step>("platform");
  const [platform, setPlatform] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const activeStepIndex = stepOrder.indexOf(step);
  const steps = useMemo(
    () => [
      { id: "platform", label: "Platform" },
      { id: "file", label: "File" },
      { id: "upload", label: "Upload" },
      { id: "report", label: "Report" },
      { id: "done", label: "Done" },
    ],
    [],
  );

  const unsupportedCsvWarning = file && !file.name.toLowerCase().endsWith(".csv");

  const resetFlow = () => {
    setStep("platform");
    setPlatform(null);
    setFile(null);
    setUploadId(null);
    setReportId(null);
    setStatusMsg(null);
    setError(null);
    setErrorDetails(null);
    setWarnings([]);
    setBusy(false);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const runUpload = async () => {
    if (!platform || !file || busy) {
      return;
    }

    setBusy(true);
    setError(null);
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

      setStep("generating");
      setStatusMsg("Generating report…");

      const generated = await generateReport({
        upload_id: presign.upload_id,
        platform,
      });

      if (generated.warnings?.length) {
        setWarnings((prev) => [...prev, ...generated.warnings!]);
      }

      setReportId(generated.report_id);
      setStep("done");
      setStatusMsg("Report ready");
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "Unknown error";
      if (step === "generating") {
        setError("We couldn’t generate your report yet. Please try again.");
      } else {
        setError("Upload failed before completion. Please try again.");
      }
      setErrorDetails(message);
      setStep("file");
    } finally {
      setBusy(false);
    }
  };

  return (
    <UploadCard className="space-y-6 shadow-brandGlow">
      <Stepper steps={steps} activeIndex={activeStepIndex} />

      {error ? (
        <InlineAlert variant="error" title={error}>
          <div className="space-y-2">
            <button
              type="button"
              className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/15"
              onClick={runUpload}
              disabled={!platform || !file || busy}
            >
              Try again
            </button>
            {errorDetails ? (
              <details className="text-xs text-red-100/80">
                <summary className="cursor-pointer">Technical details</summary>
                <pre className="mt-2 overflow-auto whitespace-pre-wrap rounded-lg bg-black/20 p-2">{errorDetails}</pre>
              </details>
            ) : null}
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

      {(step === "uploading" || step === "generating") && busy ? (
        <div className="space-y-4">
          <StepHeader
            title={step === "uploading" ? "Uploading file" : "Generating report"}
            subtitle={step === "uploading" ? "We’re validating your upload." : "This usually takes under a minute."}
          />
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-navy-950 px-4 py-3">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <p className="text-sm text-gray-200">{statusMsg}</p>
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
              href={reportId ? `/app/report/${reportId}` : "/app"}
              className="rounded-xl bg-brand-blue px-4 py-2 text-sm font-semibold text-white shadow-brandGlow hover:bg-brand-blue/90"
            >
              View dashboard
            </Link>
            {reportId ? (
              <Link
                href={`/app/report/${reportId}`}
                className="rounded-xl border border-white/20 px-4 py-2 text-sm text-gray-100 hover:bg-white/5"
              >
                View report
              </Link>
            ) : null}
            {reportId ? (
              <Link
                href={`/app/report/${reportId}`}
                className="rounded-xl border border-white/20 px-4 py-2 text-sm text-gray-100 hover:bg-white/5"
              >
                Download JSON
              </Link>
            ) : null}
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

      {step !== "done" && step !== "uploading" && step !== "generating" ? (
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
