'use client'

import dynamic from 'next/dynamic'

// Catch-all route to preserve the existing React Router app paths (e.g. /home, /books, /wishlist, etc.)
// This keeps behavior equivalent to the prior Vite SPA while running under Next.js.
const SpaApp = dynamic(() => import('../../App'), { ssr: false })

export default function SpaCatchAllPage() {
  return <SpaApp />
}

