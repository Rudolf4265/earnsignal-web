import Link from "next/link";

export function MarketingNav() {
  return (
    <header className="w-full border-b border-white/10 backdrop-blur-md bg-black/10">
      <div className="mx-auto max-w-6xl px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 flex-1 items-center">
            <Link href="/" className="group inline-flex items-center gap-3">
              <span className="text-lg font-semibold tracking-tight text-white">EarnSigma</span>
            </Link>
          </div>

          <div className="flex flex-none items-center">
            <nav className="hidden md:flex items-center gap-8 text-sm text-white/80">
              <Link href="/" className="relative text-white">
                Home
                <span className="absolute -bottom-2 left-0 h-[2px] w-full rounded-full bg-gradient-to-r from-blue-400 to-cyan-300 shadow-[0_0_12px_rgba(59,130,246,0.55)]" />
              </Link>
              <Link href="/about" className="transition hover:text-white">
                About
              </Link>
              <Link href="/pricing" className="transition hover:text-white">
                Pricing
              </Link>
            </nav>

            <Link
              href="/login"
              className="ml-6 inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white shadow-[0_0_24px_rgba(59,130,246,0.20)] hover:bg-white/15 hover:border-white/25 transition"
            >
              Sign Up / Login
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
