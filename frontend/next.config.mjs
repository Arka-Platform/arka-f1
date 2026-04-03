import path from 'path'
import { fileURLToPath } from 'url'
import withPWA from 'next-pwa'
import runtimeCaching from 'next-pwa/cache.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const imageRemotePatterns = [
  { protocol: 'https', hostname: 'covers.openlibrary.org', pathname: '/**' },
  { protocol: 'https', hostname: 'images-na.ssl-images-amazon.com', pathname: '/**' },
  { protocol: 'https', hostname: 'm.media-amazon.com', pathname: '/**' },
  { protocol: 'https', hostname: 'i.pravatar.cc', pathname: '/**' },
  { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
]

if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  try {
    const host = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
    imageRemotePatterns.push({ protocol: 'https', hostname: host, pathname: '/**' })
  } catch {
    /* ignore invalid env */
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
  images: {
    remotePatterns: imageRemotePatterns,
  },
}

const withPwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching,
})

export default withPwaConfig(nextConfig)

