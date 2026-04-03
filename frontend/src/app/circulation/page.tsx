import { Playfair_Display, Inter } from 'next/font/google'
import CirculationView from './CirculationView'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-circ-serif',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-circ-sans',
  display: 'swap',
})

export default function CirculationPage() {
  return (
    <div className={`${playfair.variable} ${inter.variable}`}>
      <CirculationView />
    </div>
  )
}
