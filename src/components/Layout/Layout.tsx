import React from 'react'
import Header from '../Header/Header'
import './Layout.css'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="layout">
      <Header />
      <main className="layout-main">{children}</main>
    </div>
  )
}

export default Layout

