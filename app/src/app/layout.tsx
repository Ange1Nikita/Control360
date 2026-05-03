import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import SiteBackground from '@/components/layout/SiteBackground'

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: {
    default: 'Контроль 360° — Безопасность начинается с нас · Мариуполь',
    template: '%s | Контроль 360°',
  },
  description: 'Комплексные системы безопасности и диспетчеризации в Мариуполе. Видеонаблюдение, СКУД, сигнализация, центры мониторинга. Доставка по РФ.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${inter.variable} antialiased`}>
      <body className="relative min-h-screen flex flex-col bg-[#053d37] text-white overflow-x-hidden">
        <SiteBackground />
        <Header />
        <main className="relative flex-1 z-[2]">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
