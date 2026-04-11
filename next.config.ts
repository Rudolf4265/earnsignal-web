import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  transpilePackages: ["@earnsigma/brand", "@earnsigma/ui", "@earnsigma/config"],
  headers: async () => [
    {
      source: "/(.*)",
      headers: securityHeaders,
    },
  ],
  webpack: (config) => {
    // Force Webpack for production builds until this custom hook is removed or migrated off Webpack-only config.
    config.resolve.extensions.push(".ts", ".tsx");
    return config;
  },
};

export default nextConfig;
