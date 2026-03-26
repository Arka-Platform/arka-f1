import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
  outputFileTracingRoot: __dirname,
}

export default nextConfig

