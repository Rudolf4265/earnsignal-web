'use client'

import { useEffect, useRef } from 'react'

export function HeroCards() {
  const scoreRef = useRef<HTMLSpanElement>(null)
  const barFrontRef = useRef<HTMLDivElement>(null)
  const barBackRef = useRef<HTMLDivElement>(null)
  const barMiniRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timeout = setTimeout(() => {
      let start: number | null = null
      const target = 74
      function step(ts: number) {
        if (!start) start = ts
        const p = Math.min((ts - start) / 1800, 1)
        const ease = 1 - Math.pow(1 - p, 3)
        if (scoreRef.current) scoreRef.current.textContent = String(Math.round(ease * target))
        if (p < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
      if (barFrontRef.current) barFrontRef.current.style.width = '74%'
      if (barBackRef.current) barBackRef.current.style.width = '71%'
      if (barMiniRef.current) barMiniRef.current.style.width = '42%'
    }, 600)
    return () => clearTimeout(timeout)
  }, [])

  return (
    <div className="relative mx-auto" style={{ width: 360, height: 390 }}>
      {/* Back card: Platform Exposure */}
      <div
        className="absolute border backdrop-blur-sm rounded-2xl p-5"
        style={{
          top: 70, right: -16, width: 295,
          background: 'rgba(15,74,163,0.38)',
          borderColor: 'rgba(59,130,246,0.22)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
          animation: 'float-b 5s ease-in-out infinite',
          transform: 'rotate(3deg)',
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-text-muted">Platform Exposure</span>
          <span className="ml-auto text-[10px] font-bold px-2.5 py-0.5 rounded-full border" style={{ background: 'rgba(59,130,246,0.15)', borderColor: 'rgba(59,130,246,0.35)', color: 'var(--es-color-accent-blue)' }}>Risk</span>
        </div>
        <p className="text-sm font-bold text-white mb-1">71% of revenue depends on Patreon</p>
        <p className="text-xs text-brand-text-muted mb-3">A strong primary channel is also the clearest exposure point.</p>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div ref={barBackRef} className="pbar-fill" style={{ background: 'linear-gradient(90deg,#2563eb,#3b82f6)' }} />
        </div>
      </div>

      {/* Front card: Income Stability Score */}
      <div
        className="absolute border backdrop-blur-xl rounded-[18px] p-6 z-10"
        style={{
          top: 0, left: 0, width: 330,
          background: 'rgba(16,42,98,0.88)',
          borderColor: 'rgba(255,255,255,0.12)',
          boxShadow: '0 0 0 1px rgba(37,99,235,.2), 0 16px 48px rgba(0,0,0,.5), 0 0 80px rgba(37,99,235,.12)',
          animation: 'float-f 5s ease-in-out infinite',
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-text-muted">Income Stability Score</span>
          <span className="ml-auto text-[10px] font-bold px-2.5 py-0.5 rounded-full border" style={{ background: 'rgba(52,211,153,0.15)', borderColor: 'rgba(52,211,153,0.35)', color: 'var(--es-color-accent-emerald)' }}>Stable</span>
        </div>
        <div className="text-[40px] font-extrabold leading-none tracking-tight mb-1.5" style={{ fontVariantNumeric: 'tabular-nums' }}>
          <span ref={scoreRef}>0</span>
          <span className="text-xl font-semibold text-brand-text-muted"> / 100</span>
        </div>
        <p className="text-sm text-brand-text-muted leading-relaxed mb-3">Recurring income is healthy, though how it&apos;s spread across supporters is worth watching.</p>
        <div className="h-1.5 rounded-full overflow-hidden mb-4" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div ref={barFrontRef} className="pbar-fill" style={{ background: 'linear-gradient(90deg,#22c55e,#34d399)' }} />
        </div>
        <div className="border-t pt-3.5" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-text-muted mb-1.5">Next best action</p>
          <p className="text-xs text-brand-text-muted leading-relaxed">Test a clearer mid-tier offer before buying more audience.</p>
        </div>
      </div>

      {/* Mini card: Subscriber Churn */}
      <div
        className="absolute border backdrop-blur-xl rounded-2xl px-4 py-4 z-20"
        style={{
          bottom: 0, right: 14, width: 240,
          background: 'rgba(11,27,61,0.92)',
          borderColor: 'rgba(255,255,255,0.1)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          animation: 'float-m 5s ease-in-out 1.2s infinite',
        }}
      >
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-brand-text-muted">Subscriber Churn</span>
          <span className="ml-auto text-[10px] font-bold px-2.5 py-0.5 rounded-full border" style={{ background: 'rgba(245,158,11,0.13)', borderColor: 'rgba(245,158,11,0.3)', color: 'var(--es-color-accent-blue)' }}>Watch</span>
        </div>
        <p className="text-base font-bold text-white mb-2.5">42% from $8 tier</p>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div ref={barMiniRef} className="pbar-fill" style={{ background: 'linear-gradient(90deg,#d97706,#f59e0b)' }} />
        </div>
      </div>
    </div>
  )
}
