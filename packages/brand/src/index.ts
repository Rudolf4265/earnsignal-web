import { brandColors } from "./colors";
import { brandGradients } from "./gradients";
import { BRAND_NAME } from "./logo";
import { brandShadows } from "./shadows";

export { BRAND_CSS_VARIABLES } from "./css-variables";
export { brandColors, brandSemanticColors } from "./colors";
export { brandGradients } from "./gradients";
export { brandLogo, BRAND_DOMAIN, BRAND_NAME } from "./logo";
export { brandRadii } from "./radii";
export { brandShadows } from "./shadows";
export { brandSpacing } from "./spacing";
export { brandTheme } from "./theme";

export const brand = {
  name: BRAND_NAME,
  colors: brandColors,
  gradients: brandGradients,
  shadows: brandShadows,
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
