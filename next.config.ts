import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production optimizations
  poweredByHeader: false,
  compress: true,
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: '*.firebaseapp.com',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },

  // Security headers - commented out for server deployment
  // Note: These headers should be configured in nginx instead
  /*
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
  */

  // Remove static export for server deployment
  // output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  // trailingSlash: true,
  // distDir: 'out',
};

export default nextConfig;
