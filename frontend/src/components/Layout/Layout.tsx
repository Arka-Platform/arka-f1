'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import SideMenu from '../SideMenu/SideMenu'
import { CirculationDndProvider } from './CirculationDndContext'
import './Layout.css'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const pathname = usePathname()
  const FULL_BLEED_PREFIXES: string[] = []
  const isFullBleed = FULL_BLEED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))

  if (isFullBleed) {
    return (
      <div className="layout">
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <main className="layout-main" id="main-content">
          {children}
        </main>
      </div>
    )
  }

  return (
    <div className="layout">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <CirculationDndProvider>
        <div className="layout-body">
          <SideMenu />
          <main className="layout-main" id="main-content">
            {children}
          </main>
        </div>
      </CirculationDndProvider>
    </div>
  )
}

export default Layout

