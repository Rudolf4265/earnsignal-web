export const brandLogo = {
  name: "EarnSigma",
  domain: "earnsigma.com",
  // PNG used intentionally: the SVG is a 781×480 embedded-raster wrapper, not true vector.
  // Replace markPath with a proper vector export when one becomes available.
  markPath: "/brand/PNG/earnsigma-mark.png",
  lockupPath: "/brand/earnsigma-lockup.svg",
} as const;

export const BRAND_NAME = brandLogo.name;
export const BRAND_DOMAIN = brandLogo.domain;
