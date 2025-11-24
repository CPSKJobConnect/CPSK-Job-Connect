import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  // Allow build to proceed despite ESLint warnings/errors
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Prevent exposing source maps in production
  productionBrowserSourceMaps: false,

  // React strict mode is safe
  reactStrictMode: true,

  // Hide dev indicators in production
  devIndicators: {
    buildActivity: !isProd, // only show in dev
  },

  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  images: {
    domains: ['randomuser.me', 'lh3.googleusercontent.com'],
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
    ],
  },

  webpack: (config, { dev, isServer }) => {
    // SVG handling for all builds
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    // Only dev-specific options
    if (!isProd && !isServer) {
      config.watchOptions = {
        poll: false,
        aggregateTimeout: 1000,
      };
    }

    // Ensure no devtool in production
    if (isProd) {
      config.devtool = false;
    }

    return config;
  },
};

export default nextConfig;
