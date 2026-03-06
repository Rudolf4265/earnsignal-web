export const brand = {
  name: "EarnSigma",
  colors: {
    background: "#071225",
    backgroundElevated: "#0C1933",
    panel: "#102043",
    panelMuted: "#132950",
    border: "rgba(148, 163, 184, 0.28)",
    borderStrong: "rgba(96, 165, 250, 0.38)",
    textPrimary: "#EAF1FF",
    textSecondary: "#B9C7E8",
    textMuted: "#8EA2CC",
    accentBlue: "#3B82F6",
    accentBlueStrong: "#1D4ED8",
    accentTeal: "#2FD9C5",
    accentEmerald: "#34D399",
  },
  gradients: {
    appGlow: "radial-gradient(circle at 14% -8%, rgba(59, 130, 246, 0.30) 0%, rgba(59, 130, 246, 0) 48%)",
    hero: "linear-gradient(135deg, #173175 0%, #2C60CD 60%, #2FD9C5 100%)",
    navActive: "linear-gradient(135deg, rgba(59, 130, 246, 0.28) 0%, rgba(47, 217, 197, 0.18) 100%)",
  },
  shadows: {
    card: "0 18px 36px rgba(2, 6, 23, 0.36)",
    glow: "0 0 40px rgba(59, 130, 246, 0.24)",
  },
} as const;

export const BRAND_CSS_VARIABLES = {
  "--es-color-bg": brand.colors.background,
  "--es-color-bg-elevated": brand.colors.backgroundElevated,
  "--es-color-panel": brand.colors.panel,
  "--es-color-panel-muted": brand.colors.panelMuted,
  "--es-color-border": brand.colors.border,
  "--es-color-border-strong": brand.colors.borderStrong,
  "--es-color-text-primary": brand.colors.textPrimary,
  "--es-color-text-secondary": brand.colors.textSecondary,
  "--es-color-text-muted": brand.colors.textMuted,
  "--es-color-accent-blue": brand.colors.accentBlue,
  "--es-color-accent-blue-strong": brand.colors.accentBlueStrong,
  "--es-color-accent-teal": brand.colors.accentTeal,
  "--es-color-accent-emerald": brand.colors.accentEmerald,
  "--es-gradient-app-glow": brand.gradients.appGlow,
  "--es-gradient-hero": brand.gradients.hero,
  "--es-gradient-nav-active": brand.gradients.navActive,
  "--es-shadow-card": brand.shadows.card,
  "--es-shadow-glow": brand.shadows.glow,
} as const;

export const BRAND = {
  name: brand.name,
  primary: brand.colors.accentBlueStrong,
  primaryAccent: brand.colors.accentBlue,
  greenAccent: brand.colors.accentTeal,
  backgroundDark: brand.colors.background,
  borderSubtle: brand.colors.border,
  glowShadow: brand.shadows.glow,
  gradientPrimary: brand.gradients.hero,
} as const;

export const BRAND_NAME = brand.name;
export const BRAND_DOMAIN = "earnsigma.com";
