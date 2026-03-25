// Next.js App Router route transition wrapper for Framer Motion.
'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

export default function RoutePresence({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div key={pathname} style={{ height: '100%' }}>
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

