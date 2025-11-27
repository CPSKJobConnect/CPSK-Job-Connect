import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow build to proceed despite ESLint warnings/errors
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Turbopack config only for development (used with next dev --turbopack)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'asqgbzbwlosorjztdnac.supabase.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'randomuser.me',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { dev, isServer }) => {
    // SVG handling for production builds
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    if (dev && !isServer) {
      config.watchOptions = {
        poll: false, // Disable polling for better performance
        aggregateTimeout: 1000,
      }
    }

    // Suppress webpack cache serialization warnings
    config.infrastructureLogging = {
      level: 'error',
    };

    return config
  },
};

export default nextConfig;