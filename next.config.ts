import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Enable middleware support in Turbopack
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
