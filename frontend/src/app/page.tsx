'use client'

import dynamic from 'next/dynamic'

export default function Page() {
  // Preserve the existing React Router SPA entry at "/".
  const SpaApp = dynamic(() => import('../App'), { ssr: false })
  return <SpaApp />
}

