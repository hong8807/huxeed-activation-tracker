import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 성능 최적화
  reactStrictMode: true,

  // 이미지 최적화
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'eikqjezcngsxskjpleyq.supabase.co',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // 압축 활성화
  compress: true,

  // 프로덕션 소스맵 비활성화 (속도 향상)
  productionBrowserSourceMaps: false,

  experimental: {
    // Enable middleware support in Turbopack
    serverActions: {
      bodySizeLimit: '2mb',
    },

    // 정적 페이지 최적화
    optimizePackageImports: ['@supabase/supabase-js', 'exceljs', 'nodemailer'],
  },

  // 헤더 설정 (캐싱)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
        ],
      },
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
