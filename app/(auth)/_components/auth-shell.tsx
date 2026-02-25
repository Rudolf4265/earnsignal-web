import type { ReactNode } from "react";
import Image from "next/image";

export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-navy-950 px-6">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/10 to-brand-teal/10 opacity-30 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <a
            href="https://earnsigma.com"
            aria-label="Go to EarnSigma home"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2"
          >
            <Image src="/brand/earnsigma-mark.svg" alt="EarnSigma" width={36} height={36} priority />
            <span className="text-lg font-semibold text-white">EarnSigma</span>
          </a>
          <p className="mt-4 text-sm text-gray-400">Revenue intelligence for creator teams</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-navy-900 p-8 shadow-2xl">{children}</div>
      </div>
    </div>
  );
}
