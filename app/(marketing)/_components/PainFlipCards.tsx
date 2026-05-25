'use client'

import { Section, Container, cn } from '@earnsigma/ui'
import { marketingSectionClass } from './marketing-visuals'

const cards = [
  {
    front: {
      bold: "Most of your revenue comes from one platform.",
      italic: "Your dashboard doesn't tell you what that actually means — or what happens if they change the rules.",
    },
    back: {
      tag: "Platform Exposure",
      explain: (<>Your exact platform concentration in real revenue terms — and <strong className="font-bold text-brand-accent-teal">what growing a second platform to 30% would actually change</strong> about your business risk.</>),
    },
  },
  {
    front: {
      bold: "You keep losing subscribers from one tier.",
      italic: "You've tried changing the offer. You don't know which month they leave — so nothing you try is aimed at the right moment.",
    },
    back: {
      tag: "Churn Blind Spot",
      explain: (<>The exact churn window — which tier, which month of membership, how many subscribers — and <strong className="font-bold text-brand-accent-teal">what addressing it at that specific moment is worth in revenue</strong>.</>),
    },
  },
  {
    front: {
      bold: "You have four platform dashboards. None of them talk to each other.",
      italic: "You stitch it together in your head at the end of each month and hope you're not missing something.",
    },
    back: {
      tag: "No Cross-Platform View",
      explain: (<>One combined report built from all your uploads. <strong className="font-bold text-brand-accent-teal">One Income Stability Score. One diagnosis. Three specific next actions</strong> — in plain language, not charts.</>),
    },
  },
  {
    front: {
      bold: "You don't know if raising your prices will hurt you.",
      italic: "So you don't raise them.",
    },
    back: {
      tag: "Pricing Uncertainty",
      explain: (<>What your highest-value supporters actually look like, how price-sensitive each tier really is, and <strong className="font-bold text-brand-accent-teal">where the upgrade opportunity already exists in your current base</strong>.</>),
    },
  },
]

export function PainFlipCards() {
  return (
    <Section
      className={cn(marketingSectionClass, 'py-20 sm:py-24')}
      data-testid="marketing-pain-flip"
    >
      <Container>
        <div className="max-w-2xl mb-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-accent-teal mb-3">
            The gaps your dashboards miss
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-[2rem] leading-snug">
            You&apos;re running a business.<br />Your tools weren&apos;t built for one.
          </h2>
          <p className="mt-4 text-base text-brand-text-secondary">
            Hover each card to see what your data actually shows.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {cards.map((card) => (
            <div key={card.back.tag} className="flip-card" style={{ height: 240 }}>
              <div className="flip-inner">
                {/* Front */}
                <div
                  className="flip-front flex flex-col justify-between p-7 border"
                  style={{
                    background: 'rgba(15,20,45,0.9)',
                    borderColor: 'rgba(255,255,255,0.1)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                  }}
                >
                  <p className="text-[17px] font-semibold text-white leading-relaxed tracking-tight">
                    {card.front.bold}{' '}
                    <em className="font-normal text-brand-text-secondary not-italic">{card.front.italic}</em>
                  </p>
                  <p
                    className="text-[11px] text-brand-text-muted font-medium flex items-center gap-1.5"
                    style={{ animation: 'hint-pulse 2.5s ease-in-out infinite' }}
                  >
                    &#x27F3; hover to see what EarnSigma shows you
                  </p>
                </div>

                {/* Back */}
                <div
                  className="flip-back flex flex-col justify-center gap-3.5 p-7 border"
                  style={{
                    background: 'linear-gradient(145deg,rgba(16,42,98,0.95),rgba(11,27,61,0.98))',
                    borderColor: 'rgba(52,211,153,0.28)',
                    boxShadow: 'inset 0 0 40px rgba(52,211,153,0.05), 0 0 0 1px rgba(52,211,153,0.1)',
                  }}
                >
                  <p className="text-[10px] font-bold tracking-[1.4px] text-brand-accent-teal uppercase flex items-center gap-2">
                    <span className="w-5 h-0.5 rounded bg-brand-accent-teal flex-shrink-0" />
                    {card.back.tag}
                  </p>
                  <p className="text-[15px] text-white leading-[1.7] font-medium">
                    {card.back.explain}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  )
}
