'use client'

import { useEffect, useRef, useState } from 'react'

const SLIDES = [
  {
    label: 'Income Stability Score',
    badge: { text: 'Stable', color: 'emerald' as const },
    isScore: true,
    metricText: '',
    metricSuffix: '/ 100',
    desc: "Recurring income is healthy, though how it's spread across supporters is worth watching.",
    barPct: 74,
    barColor: 'linear-gradient(90deg,#22c55e,#34d399)',
    actionLabel: 'Next best action',
    actionText: 'Test a clearer mid-tier offer before buying more audience.',
  },
  {
    label: 'Platform Exposure',
    badge: { text: 'Risk', color: 'blue' as const },
    isScore: false,
    metricText: '71%',
    metricSuffix: 'Patreon',
    desc: "A single platform drives most of your revenue — and your clearest fragility point.",
    barPct: 71,
    barColor: 'linear-gradient(90deg,#2563eb,#3b82f6)',
    actionLabel: 'What this means',
    actionText: 'One policy change puts 71% of income at risk. A second platform at 30% changes that calculus.',
  },
  {
    label: 'Churn Window',
    badge: { text: 'Watch', color: 'amber' as const },
    isScore: false,
    metricText: 'Month 4',
    metricSuffix: '$8 tier',
    desc: "42% of $8 tier subscribers cancel in their fourth month. The timing is specific — the fix can be too.",
    barPct: 42,
    barColor: 'linear-gradient(90deg,#d97706,#f59e0b)',
    actionLabel: 'Opportunity',
    actionText: 'Targeted retention at month 3 could recover $340/mo at current subscriber volume.',
  },
  {
    label: 'Pricing Signal',
    badge: { text: 'Opportunity', color: 'teal' as const },
    isScore: false,
    metricText: '2.1×',
    metricSuffix: 'retention',
    desc: "Your $12 tier retains 2.1× longer than your $8 tier. Your pricing structure may be working against you.",
    barPct: 68,
    barColor: 'linear-gradient(90deg,#0d9488,#34d399)',
    actionLabel: 'What to test',
    actionText: 'Closing the $8 tier and surfacing $12 first could lift MRR without needing new audience.',
  },
] as const

type BadgeColor = 'emerald' | 'blue' | 'amber' | 'teal'

const BADGE: Record<BadgeColor, { bg: string; border: string; color: string }> = {
  emerald: { bg: 'rgba(52,211,153,0.15)', border: 'rgba(52,211,153,0.35)', color: '#34d399' },
  blue:    { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.35)', color: '#3b82f6' },
  amber:   { bg: 'rgba(245,158,11,0.13)', border: 'rgba(245,158,11,0.30)', color: '#f59e0b' },
  teal:    { bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.30)', color: '#2dd4bf' },
}

export function HeroCards() {
  const [slide, setSlide]     = useState(0)
  const [visible, setVisible] = useState(true)
  const [score, setScore]     = useState(0)
  const [barPct, setBarPct]   = useState(0)
  const [paused, setPaused]   = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const frontPxRef   = useRef<HTMLDivElement>(null)
  const backPxRef    = useRef<HTMLDivElement>(null)
  const miniPxRef    = useRef<HTMLDivElement>(null)
  const barBackRef   = useRef<HTMLDivElement>(null)
  const barMiniRef   = useRef<HTMLDivElement>(null)

  // Count-up animation on slide 0
  useEffect(() => {
    if (slide !== 0) return
    let raf: number
    let start: number | null = null
    const tick = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / 1800, 1)
      setScore(Math.round((1 - Math.pow(1 - p, 3)) * 74))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [slide])

  // Bar fill on slide change
  useEffect(() => {
    setBarPct(0)
    const t = setTimeout(() => setBarPct(SLIDES[slide].barPct), 80)
    return () => clearTimeout(t)
  }, [slide])

  // Back + mini bars on mount
  useEffect(() => {
    const t = setTimeout(() => {
      if (barBackRef.current) barBackRef.current.style.width = '71%'
      if (barMiniRef.current) barMiniRef.current.style.width = '42%'
    }, 700)
    return () => clearTimeout(t)
  }, [])

  // Auto-advance every 3.8s
  useEffect(() => {
    if (paused) return
    const id = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setSlide(s => (s + 1) % SLIDES.length)
        setScore(0)
        setVisible(true)
      }, 380)
    }, 3800)
    return () => clearInterval(id)
  }, [paused])

  // Mouse parallax — different depths per card layer
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const move = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const dx = (e.clientX - rect.left - rect.width  / 2) / rect.width
      const dy = (e.clientY - rect.top  - rect.height / 2) / rect.height
      if (frontPxRef.current) frontPxRef.current.style.transform = `translate(${dx * 16}px, ${dy * 9}px)`
      if (backPxRef.current)  backPxRef.current.style.transform  = `translate(${dx * 7}px,  ${dy * 4}px)`
      if (miniPxRef.current)  miniPxRef.current.style.transform  = `translate(${dx * 22}px, ${dy * 13}px)`
    }

    const leave = () => {
      ;[frontPxRef, backPxRef, miniPxRef].forEach(r => {
        if (r.current) r.current.style.transform = 'translate(0,0)'
      })
    }

    window.addEventListener('mousemove', move, { passive: true })
    container.addEventListener('mouseleave', leave)
    return () => {
      window.removeEventListener('mousemove', move)
      container.removeEventListener('mouseleave', leave)
    }
  }, [])

  const goTo = (i: number) => {
    if (i === slide) return
    setPaused(true)
    setVisible(false)
    setTimeout(() => {
      setSlide(i)
      setScore(0)
      setVisible(true)
      setTimeout(() => setPaused(false), 8000)
    }, 380)
  }

  const s     = SLIDES[slide]
  const badge = BADGE[s.badge.color]

  return (
    <div ref={containerRef} className="relative mx-auto" style={{ width: 360, height: 440 }}>

      {/* Back card: Platform Exposure — depth 0.5 */}
      <div
        ref={backPxRef}
        className="absolute"
        style={{ top: 70, right: -16, width: 295, transition: 'transform 0.2s ease-out' }}
      >
        <div style={{ animation: 'float-b 5s ease-in-out infinite' }}>
          <div
            className="border backdrop-blur-sm rounded-2xl p-5"
            style={{
              transform: 'rotate(3deg)',
              background: 'rgba(15,74,163,0.38)',
              borderColor: 'rgba(59,130,246,0.22)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-brand-text-muted">Platform Exposure</span>
              <span className="ml-auto text-[10px] font-bold px-2.5 py-0.5 rounded-full border" style={{ background: BADGE.blue.bg, borderColor: BADGE.blue.border, color: BADGE.blue.color }}>Risk</span>
            </div>
            <p className="text-sm font-bold text-white mb-1">71% of revenue depends on Patreon</p>
            <p className="text-xs text-brand-text-muted mb-3">A strong primary channel is also the clearest exposure point.</p>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div ref={barBackRef} className="pbar-fill" style={{ background: 'linear-gradient(90deg,#2563eb,#3b82f6)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Front card: cycling insights — depth 1 */}
      <div
        ref={frontPxRef}
        className="absolute z-10"
        style={{ top: 0, left: 0, width: 330, transition: 'transform 0.2s ease-out' }}
      >
        <div style={{ animation: 'float-f 5s ease-in-out infinite' }}>
          <div
            className="border backdrop-blur-xl rounded-[18px] p-6"
            style={{
              background: 'rgba(16,42,98,0.88)',
              borderColor: 'rgba(255,255,255,0.12)',
              boxShadow: '0 0 0 1px rgba(37,99,235,.2), 0 16px 48px rgba(0,0,0,.5), 0 0 80px rgba(37,99,235,.12)',
            }}
          >
            {/* Slide content — fades between slides */}
            <div style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.35s ease', minHeight: 210 }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold uppercase tracking-widest text-brand-text-muted">{s.label}</span>
                <span className="ml-auto text-[10px] font-bold px-2.5 py-0.5 rounded-full border" style={{ background: badge.bg, borderColor: badge.border, color: badge.color }}>{s.badge.text}</span>
              </div>

              <div className="text-[40px] font-extrabold leading-none tracking-tight mb-1.5" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {s.isScore ? (
                  <>{score}<span className="text-xl font-semibold text-brand-text-muted"> {s.metricSuffix}</span></>
                ) : (
                  <>{s.metricText}<span className="text-xl font-semibold text-brand-text-muted ml-2">{s.metricSuffix}</span></>
                )}
              </div>

              <p className="text-sm text-brand-text-muted leading-relaxed mb-3">{s.desc}</p>

              <div className="h-1.5 rounded-full overflow-hidden mb-4" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div style={{ width: `${barPct}%`, background: s.barColor, transition: 'width 0.9s cubic-bezier(0.4,0,0.2,1)', height: '100%', borderRadius: 9999 }} />
              </div>

              <div className="border-t pt-3.5" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-text-muted mb-1.5">{s.actionLabel}</p>
                <p className="text-xs text-brand-text-muted leading-relaxed">{s.actionText}</p>
              </div>
            </div>

            {/* Progress dots */}
            <div className="flex items-center gap-1.5 mt-4">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Slide ${i + 1}`}
                  onClick={() => goTo(i)}
                  className="h-1 rounded-full focus:outline-none"
                  style={{
                    width: i === slide ? 20 : 6,
                    background: i === slide ? '#34d399' : 'rgba(255,255,255,0.2)',
                    cursor: i === slide ? 'default' : 'pointer',
                    transition: 'width 0.3s ease, background 0.3s ease',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mini card: Subscriber Churn — depth 1.5 (closest to viewer) */}
      <div
        ref={miniPxRef}
        className="absolute z-20"
        style={{ bottom: 0, right: 14, width: 240, transition: 'transform 0.2s ease-out' }}
      >
        <div style={{ animation: 'float-m 5s ease-in-out 1.2s infinite' }}>
          <div
            className="border backdrop-blur-xl rounded-2xl px-4 py-4"
            style={{
              background: 'rgba(11,27,61,0.92)',
              borderColor: 'rgba(255,255,255,0.1)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}
          >
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-brand-text-muted">Subscriber Churn</span>
              <span className="ml-auto text-[10px] font-bold px-2.5 py-0.5 rounded-full border" style={{ background: BADGE.amber.bg, borderColor: BADGE.amber.border, color: BADGE.amber.color }}>Watch</span>
            </div>
            <p className="text-base font-bold text-white mb-2.5">42% from $8 tier</p>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div ref={barMiniRef} className="pbar-fill" style={{ background: 'linear-gradient(90deg,#d97706,#f59e0b)' }} />
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
