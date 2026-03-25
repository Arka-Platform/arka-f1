import React from 'react'
import Header from '../Header/Header'
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
      <Header />
      <main className="layout-main" id="main-content">
        {children}
      </main>
    </div>
  )
}

export default Layout

