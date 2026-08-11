/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  trailingSlash: true,
  env: {
    // Netlify sets COMMIT_REF at build time only, so bake it in for /api/health
    // to read at runtime. Lets you check which commit is actually deployed.
    BUILD_COMMIT_REF: process.env.COMMIT_REF || "local",
    BUILD_TIME: new Date().toISOString(),
  },
};

module.exports = nextConfig;
