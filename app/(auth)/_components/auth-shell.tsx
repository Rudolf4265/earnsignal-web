import type { ReactNode } from "react";
import { BrandMark } from "@/components/brand/brand-mark";

export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-brand-bg px-6 text-brand-text-primary">
      <div className="absolute inset-0 bg-[var(--es-gradient-app-glow)] opacity-80" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_86%_14%,rgba(47,217,197,0.16),rgba(47,217,197,0)_46%)]" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <a
            href="https://earnsigma.com"
            aria-label="Go to EarnSigma home"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2"
          >
              <BrandMark
                priority
                className="inline-flex items-center gap-2"
                iconClassName="h-9 w-9"
                labelClassName="text-lg font-semibold text-white leading-none"
              />
            </a>
          <p className="mt-4 text-sm text-brand-text-secondary">Revenue intelligence for creator teams</p>
        </div>

        <div className="rounded-2xl border border-brand-border bg-brand-panel/95 p-8 shadow-brand-card">{children}</div>
      </div>
    </div>
  );
}
