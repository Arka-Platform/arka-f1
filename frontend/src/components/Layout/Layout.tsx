
"use client"

import React from 'react'
import SideMenu from '../SideMenu/SideMenu'
import './Layout.css'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="layout">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="layout-body">
        <SideMenu />
        <main className="layout-main" id="main-content">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout

