import { brandColors, brandSemanticColors } from "./colors";
import { brandGradients } from "./gradients";
import { brandLogo } from "./logo";
import { brandRadii } from "./radii";
import { brandShadows } from "./shadows";
import { brandSpacing } from "./spacing";

export const brandTheme = {
  name: brandLogo.name,
  colors: brandColors,
  semanticColors: brandSemanticColors,
  gradients: brandGradients,
  shadows: brandShadows,
  radii: brandRadii,
  spacing: brandSpacing,
} as const;
