import path from 'path'
import { fileURLToPath } from 'url'
import withPWA from 'next-pwa'
import runtimeCaching from 'next-pwa/cache.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
}

const withPwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching,
})

export default withPwaConfig(nextConfig)

