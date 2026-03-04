import { panelClassName } from "./dashboardStyles";

export function RevenueTrendCard() {
  return (
    <section className={panelClassName}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-white">Revenue Trend</h2>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">Last 12 months</span>
      </div>
      <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
        <svg viewBox="0 0 700 260" className="h-56 w-full" role="img" aria-label="Revenue trend placeholder chart">
          <defs>
            <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(96 165 250 / 0.45)" />
              <stop offset="100%" stopColor="rgb(30 64 175 / 0.02)" />
            </linearGradient>
          </defs>
          <rect width="700" height="260" fill="transparent" />
          {Array.from({ length: 8 }).map((_, index) => (
            <line
              key={`h-${index}`}
              x1="0"
              y1={index * 36}
              x2="700"
              y2={index * 36}
              stroke="rgb(148 163 184 / 0.16)"
              strokeWidth="1"
            />
          ))}
          {Array.from({ length: 12 }).map((_, index) => (
            <line
              key={`v-${index}`}
              x1={index * 64}
              y1="0"
              x2={index * 64}
              y2="260"
              stroke="rgb(148 163 184 / 0.10)"
              strokeWidth="1"
            />
          ))}
          <path
            d="M0 208 L50 193 L102 168 L160 147 L218 156 L275 124 L330 119 L383 133 L435 104 L490 116 L548 91 L602 53 L660 49 L700 24 L700 260 L0 260 Z"
            fill="url(#trend-fill)"
          />
          <path
            d="M0 208 L50 193 L102 168 L160 147 L218 156 L275 124 L330 119 L383 133 L435 104 L490 116 L548 91 L602 53 L660 49 L700 24"
            fill="none"
            stroke="rgb(96 165 250)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <p className="mt-3 text-sm text-white/60">Upload data to replace this preview with measured revenue performance.</p>
    </section>
  );
}
