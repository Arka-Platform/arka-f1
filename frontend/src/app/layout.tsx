import type { ReactNode } from 'react'
import Providers from '../components/providers/Providers'
import '../index.css'
import RoutePresence from '../components/motion/RoutePresence'
import AppShell from '../components/app/AppShell'

export const metadata = {
  title: 'Arka',
  description: 'Arka web app',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AppShell>
            <RoutePresence>{children}</RoutePresence>
          </AppShell>
        </Providers>
      </body>
    </html>
  )
}

