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
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Upload data</h1>
        <p className="text-slate-600">
          Upload a supported CSV export to validate your workspace, generate a report when your plan allows it, and unlock EarnSigma guidance.
        </p>
        <p className="text-sm text-slate-600">
          Earn handles revenue and subscriptions first. Grow is the audience and engagement side, and richer scorecards appear when supported analytics are available.
        </p>
        <p className="text-xs text-slate-500">Report generation access depends on your billing plan.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UploadStepper />
        </div>

        <div className="space-y-4">
          <UploadCard>
            <div id="upload-guide" data-testid="data-upload-guide">
              <h3 className="text-base font-semibold text-slate-900">What to upload today</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                The guided upload flow currently accepts {supportedRevenueUploads}. Start with the freshest export that reflects your revenue and subscriber history.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                Grow may still appear lighter until supported analytics are available for richer scorecards.
              </p>
            </div>
          </UploadCard>

          <UploadCard>
            <h3 className="text-base font-semibold text-slate-900">What happens next</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
              <li>Automated CSV validation before analysis.</li>
              <li>Processing continues into a report when your plan includes report generation.</li>
              <li>Your dashboard updates as soon as the latest workspace evidence is ready.</li>
            </ul>
          </UploadCard>

          <UploadCard>
            <h3 className="text-base font-semibold text-slate-900">Need help uploading?</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Review the in-app help guide for supported uploads, Earn vs Grow guidance, and troubleshooting steps before you retry.
            </p>
            <Link href="/app/help#upload-guide" className={buttonClassName({ variant: "secondary", size: "sm", className: "mt-4" })}>
              Open help guide
            </Link>
          </UploadCard>

          <UploadCard>
            <h3 className="text-base font-semibold text-slate-900">Recent uploads</h3>
            <p className="mt-2 text-sm text-slate-600">No uploads yet</p>
            <p className="text-xs text-slate-500">Your validated uploads will appear here once you complete the first supported CSV upload.</p>
          </UploadCard>
        </div>
      </div>
    </div>
  );
}
