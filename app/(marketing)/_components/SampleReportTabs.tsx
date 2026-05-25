'use client'

import { useState, useEffect, useRef } from 'react'
import { Section, Container, cn } from '@earnsigma/ui'
import {
  marketingSectionClass,
  marketingEyebrowClass,
  marketingPremiumCardClass,
  marketingPremiumCardOverlayClass,
  marketingTopShineClass,
  marketingPillClass,
} from './marketing-visuals'

const TAB_DURATION = 4000

const TAB_LABELS = [
  'Business Summary',
  'Biggest Opportunity',
  'Income Stability',
  'Platform Exposure',
  'Projected Upside',
  'Next 3 Actions',
]

export function SampleReportTabs() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [started, setStarted] = useState(false)
  const [sweepKey, setSweepKey] = useState(0)
  const sectionRef = useRef<HTMLElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true) },
      { threshold: 0.25 }
    )
    const el = sectionRef.current
    if (el) obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!started || paused) return
    timerRef.current = setInterval(() => {
      setActive(a => {
        const next = (a + 1) % TAB_LABELS.length
        setSweepKey(k => k + 1)
        return next
      })
    }, TAB_DURATION)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [started, paused])

  const handleTabClick = (i: number) => {
    if (timerRef.current) clearInterval(timerRef.current)
    setActive(i)
    setSweepKey(k => k + 1)
    setPaused(false)
    setStarted(true)
  }

  return (
    <section
      ref={sectionRef}
      className={cn(marketingSectionClass, 'pb-20 sm:pb-24 lg:pb-28')}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => { setPaused(false); setSweepKey(k => k + 1) }}
      data-testid="marketing-sample-report-tabs"
    >
      <Container>
        <div className="max-w-2xl mb-10">
          <p className={cn('relative', marketingEyebrowClass)}>SAMPLE OUTPUT</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-[2rem]">
            What a real EarnSigma report actually shows
          </h2>
          <p className="mt-4 text-base leading-relaxed text-brand-text-secondary">
            Plain language. Specific findings. Not just data — a diagnosis.
          </p>
        </div>

        {/* Tab bar */}
        <div className="relative mb-10 border-b overflow-x-auto" style={{ borderColor: 'rgba(255,255,255,0.09)', scrollbarWidth: 'none' }}>
          <div className="flex min-w-max">
            {TAB_LABELS.map((label, i) => (
              <button
                key={label}
                onClick={() => handleTabClick(i)}
                className={cn(
                  'relative whitespace-nowrap px-5 py-3 text-[13px] font-semibold transition-colors',
                  active === i ? 'text-white' : 'text-brand-text-muted hover:text-brand-text-secondary'
                )}
              >
                {label}
                {active === i && (
                  <span
                    key={sweepKey}
                    className={cn('tab-sweep', started && !paused ? 'playing' : 'instant')}
                    style={{ '--tab-dur': `${TAB_DURATION}ms` } as React.CSSProperties}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Panels */}
        <div className={cn(marketingPremiumCardClass, 'p-0 overflow-hidden')}>
          <div className={marketingPremiumCardOverlayClass} />
          <div className={marketingTopShineClass} />

          {/* Header */}
          <div className="relative border-b px-6 py-4 flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-accent-teal">{TAB_LABELS[active]}</p>
            <span className={cn(marketingPillClass, 'text-[10px]')}>Sample Report</span>
          </div>

          <div className="relative p-6 sm:p-7 min-h-[320px]">
            {active === 0 && <PanelSummary />}
            {active === 1 && <PanelOpportunity />}
            {active === 2 && <PanelStability />}
            {active === 3 && <PanelPlatform />}
            {active === 4 && <PanelUpside />}
            {active === 5 && <PanelActions />}
          </div>
        </div>
      </Container>
    </section>
  )
}

function PanelSummary() {
  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Stability Score', val: '74', note: 'Stable recurring base', color: 'text-brand-accent-teal' },
          { label: 'Platform Risk', val: '71%', note: 'Revenue on one platform', color: 'text-brand-accent-blue' },
          { label: 'Top Churn Source', val: '42%', note: 'Cancellations from $8 tier', color: 'text-white' },
        ].map(chip => (
          <div key={chip.label} className={cn('rounded-xl border p-4', 'bg-brand-panel/30 border-white/[0.07]')}>
            <p className="text-[10px] uppercase tracking-[1px] text-brand-text-muted mb-1.5">{chip.label}</p>
            <p className={cn('text-2xl font-bold tracking-tight mb-1', chip.color)}>{chip.val}</p>
            <p className="text-xs text-brand-text-muted">{chip.note}</p>
          </div>
        ))}
      </div>
      <div className="border-l-2 pl-4 text-sm leading-relaxed text-brand-text-secondary" style={{ borderColor: 'rgba(52,211,153,0.35)' }}>
        Your creator business is generating <strong className="text-white font-semibold">stable recurring revenue</strong> with a healthy base of loyal supporters, but there are two signals worth acting on: a heavy reliance on a single platform, and a predictable churn pattern in your entry-level tier. <strong className="text-white font-semibold">Both are fixable.</strong>
      </div>
    </div>
  )
}

function PanelOpportunity() {
  return (
    <div>
      <div className="rounded-xl border p-5 mb-4" style={{ background: 'linear-gradient(135deg,rgba(52,211,153,.07),rgba(37,99,235,.07))', borderColor: 'rgba(52,211,153,0.18)' }}>
        <p className="text-[10px] font-bold tracking-[1.2px] text-brand-accent-teal uppercase mb-2">&#127919; Primary Finding</p>
        <h3 className="text-lg font-bold text-white mb-2 tracking-tight">Your mid-tier gap is the clearest revenue lever you have right now.</h3>
        <p className="text-sm text-brand-text-secondary leading-relaxed mb-3">Your top supporters are spending at $30+/month, but the $8 tier is leaking subscribers at 42%. There&apos;s no strong mid-tier offer between them. A well-positioned $18–$22 tier could absorb churning $8 supporters and capture upgrade intent from loyalists.</p>
        <div className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-bold text-brand-accent-teal" style={{ background: 'rgba(52,211,153,0.1)', borderColor: 'rgba(52,211,153,0.22)' }}>
          &#128200; Modelled upside: +18% monthly revenue
        </div>
      </div>
      <p className="text-[12.5px] text-brand-text-muted leading-relaxed">This estimate is based on your current tier distribution, churn window data, and typical upgrade conversion patterns in your revenue band. Your report includes the full methodology.</p>
    </div>
  )
}

function PanelStability() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-8 items-center">
      <div className="relative flex-shrink-0 w-36 h-36 mx-auto sm:mx-0">
        <svg width="144" height="144" viewBox="0 0 144 144" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="72" cy="72" r="58" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
          <circle cx="72" cy="72" r="58" fill="none" stroke="url(#sg)" strokeWidth="10"
            strokeDasharray="364" strokeDashoffset={364 - (74 / 100) * 364} strokeLinecap="round" />
          <defs>
            <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold tracking-tight">74</span>
          <span className="text-xs text-brand-text-muted">/ 100</span>
          <span className="text-[10px] font-bold tracking-wider text-brand-accent-teal mt-0.5">STABLE</span>
        </div>
      </div>
      <div className="space-y-4">
        {[
          { label: 'Source coverage', val: 85 },
          { label: 'Audience momentum', val: 70 },
          { label: 'Engagement signal', val: 58 },
        ].map(f => (
          <div key={f.label}>
            <div className="flex justify-between text-[12.5px] mb-1.5">
              <span className="text-brand-text-secondary">{f.label}</span>
              <strong className="text-white">{f.val} / 100</strong>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full bg-gradient-to-r from-brand-accent-blue/60 to-brand-accent-teal/80" style={{ width: `${f.val}%` }} />
            </div>
          </div>
        ))}
        <p className="text-xs text-brand-text-muted italic mt-2">Composite of source coverage, audience momentum, and engagement signal from your uploaded data.</p>
      </div>
    </div>
  )
}

function PanelPlatform() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-8 items-start">
      <div>
        {[
          { name: 'Patreon', pct: 71, color: '#2563eb' },
          { name: 'Substack', pct: 19, color: '#22c55e' },
          { name: 'YouTube', pct: 10, color: '#34d399' },
        ].map(p => (
          <div key={p.name} className="mb-4">
            <div className="flex justify-between text-sm font-semibold mb-1.5">
              <span className="text-white">{p.name}</span>
              <span className="text-brand-text-muted">{p.pct}%</span>
            </div>
            <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full" style={{ width: `${p.pct}%`, background: p.color }} />
            </div>
          </div>
        ))}
        <div className="rounded-xl border p-3 mt-2 text-sm text-brand-text-secondary leading-relaxed" style={{ background: 'rgba(59,130,246,.07)', borderColor: 'rgba(59,130,246,0.18)' }}>
          <strong className="text-white">Platform risk is real.</strong> 71% dependence on one platform creates significant exposure.
        </div>
      </div>
      <div className="flex flex-col items-center gap-4 mx-auto sm:mx-0">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="46" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="18" />
          <circle cx="60" cy="60" r="46" fill="none" stroke="#2563eb" strokeWidth="18"
            strokeDasharray="289" strokeDashoffset={289 * (1 - 0.71)} transform="rotate(-90 60 60)" />
          <text x="60" y="56" textAnchor="middle" fill="white" fontSize="15" fontWeight="800" fontFamily="Inter,sans-serif">71%</text>
          <text x="60" y="70" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="Inter,sans-serif">Patreon</text>
        </svg>
        <div className="space-y-2">
          {[{ color: '#2563eb', label: 'Patreon — 71%' }, { color: '#22c55e', label: 'Substack — 19%' }, { color: '#94a3b8', label: 'YouTube — 10%' }].map(l => (
            <div key={l.label} className="flex items-center gap-2 text-xs text-brand-text-muted">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: l.color }} />
              {l.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PanelUpside() {
  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        {[
          { label: 'Mid-tier offer', val: '+18%', color: 'text-brand-accent-teal', note: 'Add a $18–$22 tier to capture upgrade intent from churning $8 subscribers.' },
          { label: 'Churn reduction', val: '+11%', color: 'text-brand-accent-blue', note: 'Closing the $8-tier churn window adds meaningful recurring revenue.' },
          { label: 'Platform spread', val: 'Risk ↓', color: 'text-white', note: 'Growing Substack to 30% materially reduces single-platform exposure.' },
          { label: 'Combined (90 days)', val: '+27%', color: 'text-brand-accent-teal', note: 'Mid-tier offer and churn fix together in the next quarter.' },
        ].map(u => (
          <div key={u.label} className="rounded-xl border p-4" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.07)' }}>
            <p className="text-[10px] uppercase tracking-wider text-brand-text-muted mb-1.5">{u.label}</p>
            <p className={cn('text-2xl font-extrabold tracking-tight mb-1', u.color)}>{u.val}</p>
            <p className="text-[12.5px] text-brand-text-muted leading-relaxed">{u.note}</p>
          </div>
        ))}
      </div>
      <p className="text-[12.5px] text-brand-text-muted leading-relaxed rounded-xl border p-3" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        Projections are modelled estimates based on your uploaded data. They are directional, not guaranteed.
      </p>
    </div>
  )
}

function PanelActions() {
  return (
    <div className="space-y-3.5">
      {[
        { n: '1', color: 'rgba(52,211,153,0.14)', border: 'rgba(52,211,153,0.28)', text: 'var(--es-color-accent-emerald)', title: 'Test a mid-tier offer before you buy more audience.', detail: 'Your $8-tier churn pattern suggests price sensitivity at entry level, not disinterest. A $18–$22 tier gives churning supporters somewhere to land instead of cancelling outright.', impact: '+18% est.' },
        { n: '2', color: 'rgba(37,99,235,0.14)', border: 'rgba(37,99,235,0.28)', text: 'var(--es-color-accent-blue)', title: 'Identify your $8-tier churn window and address it directly.', detail: '42% of cancellations come from the $8 tier. Your full report shows exactly which month of membership is the highest-risk window — that\'s where a well-timed message makes the difference.', impact: 'High leverage' },
        { n: '3', color: 'rgba(245,158,11,0.11)', border: 'rgba(245,158,11,0.24)', text: '#f59e0b', title: 'Start building toward a second revenue platform now, not later.', detail: '71% Patreon dependence is a business risk. A deliberate effort to grow Substack revenue to 25–30% of total over the next six months reduces that exposure meaningfully.', impact: 'Risk ↓' },
      ].map(a => (
        <div key={a.n} className="flex gap-3.5 items-start rounded-xl border p-4" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 border" style={{ background: a.color, borderColor: a.border, color: a.text }}>{a.n}</div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white mb-1.5 leading-snug">{a.title}</p>
            <p className="text-[12.5px] text-brand-text-muted leading-relaxed">{a.detail}</p>
          </div>
          <div className="flex-shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap" style={{ background: 'rgba(52,211,153,0.1)', borderColor: 'rgba(52,211,153,0.2)', color: 'var(--es-color-accent-emerald)' }}>{a.impact}</div>
        </div>
      ))}
    </div>
  )
}
