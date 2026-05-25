'use client'

import { Section, Container, cn } from '@earnsigma/ui'
import { marketingEyebrowClass } from './marketing-visuals'

const reviews = [
  { quote: "I knew Patreon was my main income source. I didn't realise how exposed that actually made me until I saw it laid out clearly in one place.", attr: "Membership creator", sub: "6k Patreon supporters, Substack newsletter" },
  { quote: "I'd been losing subscribers from my entry tier for months. The report showed me exactly which month they were dropping off. That alone was worth it.", attr: "Newsletter writer", sub: "Substack + Patreon, 3 active tiers" },
  { quote: "I was about to spend money on ads to grow faster. The report told me I had a retention problem first, not a growth problem. Big difference.", attr: "YouTube creator", sub: "Multi-platform, Patreon + YouTube memberships" },
  { quote: "I thought raising prices would hurt me. The data showed my top supporters had almost no price sensitivity. I raised my top tier and nothing moved.", attr: "Patreon creator", sub: "4 active tiers, 18-month history" },
  { quote: "It's the first time I've seen my creator business explained instead of just measured. The churn breakdown alone changed how I think about my tiers.", attr: "Multi-platform creator", sub: "Patreon + Substack + YouTube" },
  { quote: "I uploaded my Patreon and Substack exports expecting a spreadsheet. What came back was a diagnosis. It told me what was wrong and what to do about it.", attr: "Independent creator", sub: "Substack, TikTok, growing Instagram audience" },
]

export function ReviewsCarousel() {
  const doubled = [...reviews, ...reviews]
  return (
    <section
      className="relative border-t py-20 sm:py-24 overflow-hidden"
      style={{ borderColor: 'rgba(255,255,255,0.09)', background: 'radial-gradient(circle at 18% 8%,rgba(59,130,246,0.08),transparent 35%),radial-gradient(circle at 86% 22%,rgba(47,217,197,0.055),transparent 36%)' }}
      data-testid="marketing-reviews"
    >
      <Container className="mb-9">
        <p className={cn(marketingEyebrowClass)}>WHAT CREATORS ARE TELLING US</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-[2rem]">Early access feedback</h2>
      </Container>
      <div className="reviews-track-outer">
        <div className="reviews-track px-0">
          {doubled.map((r, i) => (
            <div
              key={i}
              className="flex-shrink-0 rounded-2xl border p-6"
              style={{
                width: 340,
                background: 'rgba(255,255,255,0.04)',
                borderColor: 'rgba(255,255,255,0.1)',
              }}
            >
              <p className="text-[14.5px] text-white leading-[1.65] mb-4 italic">
                <span className="text-2xl text-brand-accent-teal not-italic mr-1 leading-none align-bottom">&ldquo;</span>
                {r.quote}
              </p>
              <div>
                <p className="text-xs font-semibold text-brand-text-secondary">{r.attr}</p>
                <p className="text-[11.5px] text-brand-text-muted mt-0.5">{r.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
