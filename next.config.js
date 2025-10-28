/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  trailingSlash: true,
  eslint: {
    // Allow production builds to succeed even with ESLint errors
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
