'use client'

import { useEffect, useRef, useState } from 'react'
import { Logo } from '@earnsigma/ui'

// Badge colors mapped to brand CSS variables
const INSIGHTS = [
  {
    label: 'Platform Exposure',
    value: '71%',
    suffix: 'Patreon',
    badge: {
      text: 'Risk',
      bg: 'rgba(59,130,246,0.14)',
      border: 'rgba(59,130,246,0.28)',
      color: 'var(--es-color-accent-blue)',       // #3B82F6
    },
  },
  // Illustrative values, but only for metrics the product actually computes
  // (audit 2026-08: the previous "Churn Window" and "Pricing Signal" cards had
  // no computed counterpart anywhere in the backend).
  {
    label: 'Stability Index',
    value: '74',
    suffix: 'of 100',
    badge: {
      text: 'Watch',
      bg: 'rgba(245,158,11,0.13)',
      border: 'rgba(245,158,11,0.28)',
      color: '#fbbf24',                            // amber — not in brand palette, kept as-is
    },
  },
  {
    label: 'Tier Signal',
    value: 'Entry-heavy',
    suffix: 'upgrade room',
    badge: {
      text: 'Opportunity',
      bg: 'rgba(47,217,197,0.13)',
      border: 'rgba(47,217,197,0.28)',
      color: 'var(--es-color-accent-teal)',        // #2FD9C5
    },
  },
] as const

const ARC_LEN = 252
const TARGET_SCORE = 74

export function HeroCards() {
  const [score, setScore]           = useState(0)
  const [gaugeValue, setGaugeValue] = useState(0)
  const [rows, setRows]             = useState([false, false, false])

  const containerRef = useRef<HTMLDivElement>(null)
  const cardRef      = useRef<HTMLDivElement>(null)

  // Count-up animation
  useEffect(() => {
    let raf: number
    let start: number | null = null
    const tick = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / 1900, 1)
      setScore(Math.round((1 - Math.pow(1 - p, 3)) * TARGET_SCORE))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    const t = setTimeout(() => { raf = requestAnimationFrame(tick) }, 300)
    return () => { clearTimeout(t); cancelAnimationFrame(raf) }
  }, [])

  // Gauge fill
  useEffect(() => {
    const t = setTimeout(() => setGaugeValue(Math.round(ARC_LEN * TARGET_SCORE / 100)), 300)
    return () => clearTimeout(t)
  }, [])

  // Insight rows staggered fade-in
  useEffect(() => {
    const timers = [
      setTimeout(() => setRows(r => [true,  r[1], r[2]]), 1400),
      setTimeout(() => setRows(r => [r[0],  true, r[2]]), 1700),
      setTimeout(() => setRows(r => [r[0], r[1],  true]), 2000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  // Mouse parallax
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const move = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const dx = (e.clientX - rect.left - rect.width  / 2) / rect.width
      const dy = (e.clientY - rect.top  - rect.height / 2) / rect.height
      if (cardRef.current) cardRef.current.style.transform = `translate(${dx * 14}px, ${dy * 8}px)`
    }
    const leave = () => {
      if (cardRef.current) cardRef.current.style.transform = 'translate(0, 0)'
    }
    window.addEventListener('mousemove', move, { passive: true })
    container.addEventListener('mouseleave', leave)
    return () => {
      window.removeEventListener('mousemove', move)
      container.removeEventListener('mouseleave', leave)
    }
  }, [])

  return (
    <div ref={containerRef} className="relative mx-auto flex items-center justify-center" style={{ width: 380, height: 500 }}>
      <div ref={cardRef} style={{ transition: 'transform 0.2s ease-out', width: '100%' }}>
        <div style={{ animation: 'float-f 5s ease-in-out infinite' }}>
          <div
            className="border backdrop-blur-xl rounded-[20px] p-6"
            style={{
              background: 'var(--es-color-panel)',          // #102043 — brand panel
              borderColor: 'var(--es-color-border)',         // rgba(148,163,184,0.28)
              boxShadow: 'var(--es-shadow-card), 0 0 0 1px rgba(96,165,250,0.12)',
            }}
          >
            {/* Card header — EarnSigma branding */}
            <div
              className="flex items-center justify-between mb-5 pb-4"
              style={{ borderBottom: '1px solid var(--es-color-border)' }}
            >
              <Logo
                iconClassName="h-5 w-5"
                labelClassName="text-sm font-semibold"
                priority
              />
              <span className="text-[11px]" style={{ color: 'var(--es-color-text-muted)' }}>
                Creator Report · May 2026
              </span>
            </div>

            {/* EarnScore arc gauge */}
            <div className="text-center mb-5">
              <p
                className="text-[10px] font-semibold mb-3"
                style={{ color: 'var(--es-color-text-muted)', letterSpacing: '0.13em', textTransform: 'uppercase' }}
              >
                EarnScore
              </p>
              <div className="relative inline-block">
                <svg viewBox="0 0 200 115" width="200" height="115" aria-hidden="true">
                  {/* Track */}
                  <path
                    d="M 20 105 A 80 80 0 0 1 180 105"
                    fill="none"
                    stroke="var(--es-color-border)"
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                  {/* Fill — brand emerald */}
                  <path
                    d="M 20 105 A 80 80 0 0 1 180 105"
                    fill="none"
                    stroke="var(--es-color-accent-emerald)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${gaugeValue} ${ARC_LEN}`}
                    style={{ transition: 'stroke-dasharray 1.9s cubic-bezier(0.4,0,0.2,1)' }}
                  />
                </svg>
                <div
                  className="absolute text-center"
                  style={{ bottom: 4, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}
                >
                  <span
                    className="font-extrabold"
                    style={{ fontSize: 46, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: 'var(--es-color-text-primary)' }}
                  >
                    {score}
                  </span>
                  <span className="font-normal" style={{ fontSize: 17, color: 'var(--es-color-text-muted)' }}>
                    {' '}/ 100
                  </span>
                </div>
              </div>
              <div className="mt-2">
                <span
                  className="text-[11px] font-bold px-3 py-1 rounded-full"
                  style={{
                    background: 'rgba(52,211,153,0.14)',
                    color: 'var(--es-color-accent-emerald)',  // #34D399
                    border: '1px solid rgba(52,211,153,0.30)',
                  }}
                >
                  Strong
                </span>
              </div>
            </div>

            {/* Insight rows — staggered fade-in */}
            <div className="flex flex-col gap-2">
              {INSIGHTS.map((insight, i) => (
                <div
                  key={insight.label}
                  className="flex items-center justify-between rounded-[10px] px-3.5 py-2.5"
                  style={{
                    background: 'var(--es-color-panel-muted)',   // #132950
                    opacity: rows[i] ? 1 : 0,
                    transform: rows[i] ? 'translateX(0)' : 'translateX(8px)',
                    transition: 'opacity 0.5s ease, transform 0.5s ease',
                  }}
                >
                  <div>
                    <p
                      className="text-[9px] font-semibold"
                      style={{ color: 'var(--es-color-text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}
                    >
                      {insight.label}
                    </p>
                    <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--es-color-text-primary)' }}>
                      {insight.value}{' '}
                      <span className="font-normal" style={{ fontSize: 12, color: 'var(--es-color-text-secondary)' }}>
                        {insight.suffix}
                      </span>
                    </p>
                  </div>
                  <span
                    className="text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap"
                    style={{
                      background: insight.badge.bg,
                      color: insight.badge.color,
                      border: `1px solid ${insight.badge.border}`,
                    }}
                  >
                    {insight.badge.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Next best action footer */}
            <div className="mt-4 pt-3.5" style={{ borderTop: '1px solid var(--es-color-border)' }}>
              <p
                className="text-[9px] font-semibold mb-1"
                style={{ color: 'var(--es-color-text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}
              >
                Next best action
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--es-color-text-secondary)' }}>
                Test a clearer mid-tier offer before buying more audience.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
