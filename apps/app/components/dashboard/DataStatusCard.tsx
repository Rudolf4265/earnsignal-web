import Link from "next/link";

import { panelClassName } from "./dashboardStyles";

type DataStatusCardProps = {
  platformsConnected: string;
  coverageMonths: string;
  lastUpload: string;
};

export function DataStatusCard({ platformsConnected, coverageMonths, lastUpload }: DataStatusCardProps) {
  return (
    <section className={panelClassName}>
      <h2 className="text-2xl font-semibold text-white">Data Status</h2>
      <dl className="mt-4 space-y-4 text-sm">
        <div>
          <dt className="text-white/60">Platforms Connected</dt>
          <dd className="mt-1 font-medium text-white">{platformsConnected}</dd>
        </div>
        <div>
          <dt className="text-white/60">Coverage</dt>
          <dd className="mt-1 font-medium text-white">{coverageMonths}</dd>
        </div>
        <div>
          <dt className="text-white/60">Last Upload</dt>
          <dd className="mt-1 font-medium text-white">{lastUpload}</dd>
        </div>
      </dl>
      <Link
        href="/app/upload"
        className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-blue-400/40 bg-blue-500/20 px-3 py-2 text-sm font-medium text-blue-100 transition hover:bg-blue-500/30"
      >
        Upload data
      </Link>
    </section>
  );
}
