import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Incremental migration: keep it simple first. We can add rewrites for legacy `/api`
  // and any asset domains later once routes are moved over.
}

export default nextConfig

