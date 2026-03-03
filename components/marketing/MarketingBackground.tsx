export function MarketingBackground() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0B1220] via-[#070B16] to-[#050812]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_40%_at_30%_10%,rgba(59,130,246,0.22),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_40%_at_75%_35%,rgba(34,211,238,0.18),transparent_62%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.10] mix-blend-soft-light"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180' viewBox='0 0 180 180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.15' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
        }}
      />

      <svg
        aria-hidden
        viewBox="0 0 420 420"
        className="pointer-events-none absolute right-[-120px] bottom-[-120px] h-[720px] w-[720px] opacity-[0.05] blur-[0.5px]"
      >
        <defs>
          <linearGradient id="sigmaGlow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#93C5FD" />
            <stop offset="100%" stopColor="#22D3EE" />
          </linearGradient>
        </defs>
        <path
          d="M310 45H100l100 115-100 115h210"
          fill="none"
          stroke="url(#sigmaGlow)"
          strokeWidth="26"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </>
  );
}
