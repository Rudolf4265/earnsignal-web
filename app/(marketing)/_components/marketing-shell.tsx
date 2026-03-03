import Link from "next/link";
import { BrandMark } from "@/components/brand/brand-mark";
import { BRAND_NAME } from "@/src/lib/brand";
import { appBaseUrl } from "@/src/lib/urls";

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="inline-flex items-center" aria-label={BRAND_NAME}>
            <BrandMark
              variant="lockup"
              priority
              className="inline-flex items-center gap-2.5"
              iconClassName="h-8 w-8"
              labelClassName="text-base font-semibold tracking-tight text-slate-900 leading-none"
            />
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/pricing" className="text-slate-600 transition hover:text-slate-900">
              Pricing
            </Link>
            <a
              href={`${appBaseUrl}/login`}
              className="text-slate-600 transition hover:text-slate-900"
            >
              Sign in
            </a>
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

      <footer className="border-t border-slate-200 py-10 text-sm text-slate-500">
        <div className="mx-auto flex max-w-6xl justify-between px-6">
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
