import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@earnsigma/brand", "@earnsigma/ui", "@earnsigma/config"],
  webpack: (config) => {
    config.resolve.extensions.push(".ts", ".tsx");
    return config;
  },
};

export default nextConfig;
