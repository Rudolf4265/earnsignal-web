import Link from "next/link";
import { appBaseUrl } from "@/src/lib/urls";

export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-6 pt-16 pb-10 lg:pt-20">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <h1 className="text-5xl leading-[1.05] font-semibold tracking-tight text-white sm:text-6xl">
            Revenue doesn&apos;t plateau
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-white/70 max-w-xl">
            EarnSigma reveals the structure behind creator revenue — stability, churn velocity,
            tier migration, and platform risk.
          </p>
          <Link
            href={`${appBaseUrl}/login`}
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_40px_rgba(59,130,246,0.35)] hover:from-blue-400 hover:to-blue-600 transition"
          >
Get started in app
          </Link>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 rounded-3xl bg-[radial-gradient(50%_50%_at_50%_50%,rgba(59,130,246,0.20),transparent_70%)] blur-2xl" />
          <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_80px_rgba(59,130,246,0.25)] p-5">
            <svg viewBox="0 0 640 360" className="h-auto w-full" aria-hidden>
              <defs>
                <linearGradient id="cardGlow" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#1D4ED8" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.35" />
                </linearGradient>
              </defs>
              <rect x="6" y="6" width="628" height="348" rx="24" fill="rgba(8,13,28,0.8)" stroke="url(#cardGlow)" />
              <rect x="40" y="42" width="190" height="8" rx="4" fill="rgba(148,163,184,0.35)" />
              <rect x="40" y="66" width="120" height="8" rx="4" fill="rgba(148,163,184,0.25)" />
              <rect x="40" y="106" width="210" height="108" rx="12" fill="rgba(30,41,59,0.55)" stroke="rgba(148,163,184,0.2)" />
              <path d="M54 185 C95 140,112 136,142 166 C168 194,194 176,232 132" fill="none" stroke="#60A5FA" strokeWidth="5" strokeLinecap="round" />
              <rect x="270" y="106" width="180" height="108" rx="12" fill="rgba(30,41,59,0.55)" stroke="rgba(148,163,184,0.2)" />
              <rect x="290" y="178" width="18" height="22" rx="2" fill="#2563EB" />
              <rect x="320" y="152" width="18" height="48" rx="2" fill="#3B82F6" />
              <rect x="350" y="138" width="18" height="62" rx="2" fill="#22D3EE" />
              <rect x="380" y="162" width="18" height="38" rx="2" fill="#67E8F9" />
              <rect x="410" y="126" width="18" height="74" rx="2" fill="#4ADE80" />
              <rect x="470" y="106" width="140" height="190" rx="14" fill="rgba(30,41,59,0.55)" stroke="rgba(148,163,184,0.2)" />
              <path d="M484 174 C515 142,541 146,570 122 C586 108,600 102,609 102" fill="none" stroke="#93C5FD" strokeWidth="4" strokeLinecap="round" />
              <path d="M484 230 C512 212,540 214,565 193 C583 178,596 172,610 170" fill="none" stroke="#5EEAD4" strokeWidth="4" strokeLinecap="round" />
              <path d="M484 278 C512 280,540 286,565 267 C585 252,598 246,610 244" fill="none" stroke="#60A5FA" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
