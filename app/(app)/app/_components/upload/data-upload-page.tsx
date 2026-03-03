"use client";

import UploadCard from "./UploadCard";
import UploadStepper from "./upload-stepper";

export default function DataUploadPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-100">Upload data</h1>
        <p className="text-slate-300">Follow the guided steps to validate your export and generate a production-ready report.</p>
        <p className="text-xs text-slate-400">Report generation access depends on your billing plan.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UploadStepper />
        </div>

        <div className="space-y-4">
          <UploadCard>
            <h3 className="text-base font-semibold text-slate-900">What you&apos;ll get</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
              <li>Automated CSV validation before analysis.</li>
              <li>A generated report you can review in your dashboard.</li>
              <li>Clear warnings if any fields need attention.</li>
            </ul>
          </UploadCard>

          <UploadCard>
            <h3 className="text-base font-semibold text-slate-900">Recent uploads</h3>
            <p className="mt-2 text-sm text-slate-600">No uploads yet</p>
            <p className="text-xs text-slate-500">Your validated uploads will appear here.</p>
          </UploadCard>
        </div>
      </div>
    </div>
  );
}
