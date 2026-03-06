import Link from "next/link";
import { BrandMark } from "@/components/brand/brand-mark";
import { BRAND_NAME } from "@/src/lib/brand";
import { appBaseUrl } from "@/src/lib/urls";

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary">
      <header className="sticky top-0 z-20 border-b border-brand-border bg-brand-bg/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
          <Link href="/" className="inline-flex items-center" aria-label={BRAND_NAME}>
            <BrandMark
              priority
              className="inline-flex items-center gap-3"
              iconClassName="h-9 w-9"
              labelClassName="text-base font-semibold tracking-tight text-white leading-none"
            />
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/pricing" className="text-brand-text-secondary transition hover:text-white">
              Pricing
            </Link>
            <a href={`${appBaseUrl}/login`} className="text-brand-text-secondary transition hover:text-white">
              Sign in
            </a>
            <a
              href={`${appBaseUrl}/signup`}
              className="inline-flex items-center justify-center rounded-xl bg-brand-accent-blue px-5 py-2.5 font-medium text-white shadow-brand-glow transition hover:bg-brand-accent-blue-strong"
            >
              Start free trial
            </a>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-brand-border py-10 text-sm text-brand-text-muted">
        <div className="mx-auto flex max-w-7xl justify-between px-6 lg:px-8">
          <span>(c) {new Date().getFullYear()} EarnSigma</span>
          <div className="flex gap-6">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
