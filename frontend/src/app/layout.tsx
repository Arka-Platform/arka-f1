import type { ReactNode } from 'react'
import Providers from '../components/providers/Providers'
import '../index.css'

export const metadata = {
  title: 'Arka',
  description: 'Arka web app',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

