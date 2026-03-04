import Link from "next/link";

import { panelClassName } from "./dashboardStyles";

const signals = [
  "Upward trend detected",
  "2 customers drive 38% revenue",
  "Churn risk: Cohort Q3-25",
];

export function KeySignalsCard() {
  return (
    <section className={panelClassName}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-white">Key Signals</h2>
        <span className="rounded-full border border-white/10 bg-white/10 px-2 py-1 text-[11px] font-medium text-white/70">Examples</span>
      </div>
      <ul className="space-y-2">
        {signals.map((signal, index) => (
          <li key={signal} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90">
            <span
              aria-hidden
              className={`inline-flex h-2.5 w-2.5 rounded-full ${index === 0 ? "bg-emerald-300" : index === 1 ? "bg-amber-300" : "bg-rose-300"}`}
            />
            {signal}
          </li>
        ))}
      </ul>
      <Link href="/app/report" className="mt-5 inline-flex text-sm font-medium text-blue-300 transition hover:text-blue-200">
        View insights →
      </Link>
    </section>
  );
}
