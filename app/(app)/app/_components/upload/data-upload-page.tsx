"use client";

import Link from "next/link";
import UploadCard from "./UploadCard";
import UploadStepper from "./upload-stepper";
import { buttonClassName } from "@/src/components/ui/button";
import { getSupportedRevenueUploadSummary } from "@/src/lib/upload/platform-guidance";

const supportedRevenueUploads = getSupportedRevenueUploadSummary();

export default function DataUploadPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold text-slate-900">Upload data</h1>
        <p className="text-slate-600">
          Upload a supported CSV export to validate your workspace and unlock EarnSigma guidance.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UploadStepper />
        </div>

        <div className="space-y-4">
          <UploadCard>
            <div id="upload-guide" data-testid="data-upload-guide">
              <h3 className="text-base font-semibold text-slate-900">What to upload</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                Upload a fresh {supportedRevenueUploads} — the most recent export available from your platform.
              </p>
            </div>
          </UploadCard>

          <UploadCard>
            <h3 className="text-base font-semibold text-slate-900">Need help?</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Step-by-step export instructions and troubleshooting in the upload guide.
            </p>
            <Link href="/app/help#upload-guide" className={buttonClassName({ variant: "secondary", size: "sm", className: "mt-4" })}>
              Open upload guide
            </Link>
          </UploadCard>

          <UploadCard>
            <h3 className="text-base font-semibold text-slate-900">Recent uploads</h3>
            <p className="mt-2 text-sm text-slate-600">No uploads yet</p>
            <p className="mt-1 text-xs text-slate-500">Validated uploads appear here once you complete a supported CSV upload.</p>
          </UploadCard>
        </div>
      </div>
    </div>
  );
}
