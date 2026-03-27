/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  // Disable PWA in development to avoid caching issues
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  // Empty turbopack config tells Next.js 16 that we intentionally use webpack
  // (required because next-pwa adds a webpack plugin)
  turbopack: {},
  // No transpilePackages needed — Cesium is loaded via CDN script tag
};

module.exports = withPWA(nextConfig);
