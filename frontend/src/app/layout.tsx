import type { ReactNode } from 'react'
import Providers from '../components/providers/Providers'
import '../index.css'
import RoutePresence from '../components/motion/RoutePresence'

export const metadata = {
  title: 'Arka',
  description: 'Arka web app',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <RoutePresence>{children}</RoutePresence>
        </Providers>
      </body>
    </html>
  )
}

