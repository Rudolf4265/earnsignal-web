import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["app.earnsigma.com", "www.earnsigma.com", "earnsigma.com"],
  transpilePackages: ["@earnsigma/brand", "@earnsigma/ui", "@earnsigma/config"],
  webpack: (config) => {
    // Force Webpack for production builds until this custom hook is removed or migrated off Webpack-only config.
    config.resolve.extensions.push(".ts", ".tsx");
    return config;
  },
};

export default nextConfig;
