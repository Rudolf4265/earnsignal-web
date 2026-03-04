import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto max-w-6xl px-6 py-8 flex items-center justify-between text-sm text-white/55">
        <span>© 2026 EarnSigma</span>
        <div className="flex gap-6">
          <Link href="/privacy" className="transition hover:text-white/75">
            Privacy
          </Link>
          <Link href="/terms" className="transition hover:text-white/75">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
