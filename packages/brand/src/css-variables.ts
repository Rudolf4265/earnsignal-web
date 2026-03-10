import { brandColors } from "./colors";
import { brandGradients } from "./gradients";
import { brandShadows } from "./shadows";

export const BRAND_CSS_VARIABLES = {
  "--es-color-bg": brandColors.background,
  "--es-color-bg-elevated": brandColors.backgroundElevated,
  "--es-color-panel": brandColors.panel,
  "--es-color-panel-muted": brandColors.panelMuted,
  "--es-color-border": brandColors.border,
  "--es-color-border-strong": brandColors.borderStrong,
  "--es-color-text-primary": brandColors.textPrimary,
  "--es-color-text-secondary": brandColors.textSecondary,
  "--es-color-text-muted": brandColors.textMuted,
  "--es-color-accent-blue": brandColors.accentBlue,
  "--es-color-accent-blue-strong": brandColors.accentBlueStrong,
  "--es-color-accent-teal": brandColors.accentTeal,
  "--es-color-accent-emerald": brandColors.accentEmerald,
  "--es-gradient-app-glow": brandGradients.appGlow,
  "--es-gradient-hero": brandGradients.hero,
  "--es-gradient-nav-active": brandGradients.navActive,
  "--es-shadow-card": brandShadows.card,
  "--es-shadow-glow": brandShadows.glow,
} as const;
