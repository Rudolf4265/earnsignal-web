# Marketing Theme Notes

## Layout location
- Marketing styling is scoped in `app/(marketing)/layout.tsx`.
- The dark premium background is wrapped inside the marketing layout container so `/app` routes are unaffected.

## Tweaking background glow + noise
- Base/background layers live in `components/marketing/MarketingBackground.tsx`.
- Adjust global darkness by changing the base gradient stops (`from`, `via`, `to`).
- Adjust glow intensity by tuning alpha values in the radial gradients.
- Noise is a CSS inline SVG tile on the overlay layer; tweak perceived grain with:
  - `opacity-[0.10]` on the layer
  - `baseFrequency` / `numOctaves` inside the encoded SVG turbulence filter

## Swapping the hero illustration
- The hero dashboard illustration is an inline SVG in `components/marketing/Hero.tsx`.
- Replace that `<svg>` block with:
  - a different inline SVG, or
  - a `next/image` asset (e.g. under `public/marketing/`) while preserving the existing card wrapper and glow classes.
