import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
  // Incremental migration: keep it simple first. We can add rewrites for legacy `/api`
  // and any asset domains later once routes are moved over.
  turbopack: {
    // Workspace has multiple lockfiles; set explicit root for stability.
    root: __dirname,
  },
}

export default nextConfig

