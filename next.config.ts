import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@earnsigma/brand", "@earnsigma/ui", "@earnsigma/config"],
};

export default nextConfig;
