import Image from "next/image";
import Link from "next/link";
import { BRAND_NAME } from "@/src/lib/brand";
import { appBaseUrl } from "@/src/lib/urls";

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-navy-950 text-white">
      <header className="sticky top-0 backdrop-blur-md bg-navy-950/70 border-b border-white/5 z-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center" aria-label={BRAND_NAME}>
            <Image src="/brand/earnsigma-mark.svg" alt={BRAND_NAME} width={36} height={36} priority className="h-9 w-9" />
            <span className="ml-3 text-base font-semibold tracking-tight text-white">{BRAND_NAME}</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/pricing" className="text-gray-300 transition hover:text-white">
              Pricing
            </Link>
            <Link href="/login" className="text-gray-300 transition hover:text-white">
              Sign in
            </Link>
            <a
              href={`${appBaseUrl}/signup`}
              className="inline-flex items-center justify-center rounded-xl bg-brand-blue px-5 py-2.5 font-medium text-white transition hover:opacity-90"
            >
              Start free trial
            </a>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-white/5 py-10 text-sm text-gray-400">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex justify-between">
          <span>© {new Date().getFullYear()} EarnSigma</span>
          <div className="flex gap-6">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
