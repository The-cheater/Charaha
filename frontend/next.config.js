/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    
    // Image optimization
    images: {
      domains: [
        'localhost',
        'lh3.googleusercontent.com', // Google profile images
        'avatars.githubusercontent.com', // GitHub avatars
        'cdn.discordapp.com', // Discord avatars
      ],
      formats: ['image/avif', 'image/webp'],
    },
  
    // Environment variables
    env: {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    },
  
    // Headers
    async headers() {
      return [
        {
          source: '/:path*',
          headers: [
            {
              key: 'X-DNS-Prefetch-Control',
              value: 'on',
            },
            {
              key: 'Strict-Transport-Security',
              value: 'max-age=63072000; includeSubDomains; preload',
            },
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff',
            },
            {
              key: 'X-Frame-Options',
              value: 'SAMEORIGIN',
            },
            {
              key: 'X-XSS-Protection',
              value: '1; mode=block',
            },
            {
              key: 'Referrer-Policy',
              value: 'origin-when-cross-origin',
            },
          ],
        },
      ];
    },
  
    // Redirects
    async redirects() {
      return [
        {
          source: '/home',
          destination: '/',
          permanent: true,
        },
      ];
    },
  
    // Rewrites for API
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/:path*`,
        },
      ];
    },
  
    // Webpack configuration
    webpack: (config, { isServer }) => {
      // Add any custom webpack config here
      if (!isServer) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
          net: false,
          tls: false,
        };
      }
      return config;
    },
  
    // Experimental features
    experimental: {
      serverActions: {
        enabled: true,
      },
    },
  
    // Output configuration
    output: 'standalone',
  
    // Compiler options
    compiler: {
      removeConsole: process.env.NODE_ENV === 'production',
    },
  };
  
  module.exports = nextConfig;
  