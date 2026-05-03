'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FileText, Mail, Phone, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useQuoteStore } from '@/lib/quote-store'
import QuotePanel from '@/components/quote/QuotePanel'
import SearchOverlay from '@/components/layout/SearchOverlay'
import StaggeredMenu from '@/components/ui/StaggeredMenu'

const NAV_LINKS = [
  { href: '/about', label: 'О компании' },
  { href: '/services', label: 'Услуги' },
  { href: '/catalog', label: 'Каталог' },
  { href: '/calculate', label: 'Калькулятор' },
  { href: '/cases', label: 'Кейсы' },
  { href: '/blog', label: 'Блог' },
  { href: '/contacts', label: 'Контакты' },
]

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [quoteOpen, setQuoteOpen] = useState(false)
  const [, setUser] = useState<{ name: string; role: string } | null>(null)
  const { count } = useQuoteStore()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.id) setUser({ name: d.name, role: d.role })
    }).catch(() => {})
  }, [])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    window.location.href = '/'
  }

  return (
    <>
      <header className={cn(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled ? 'shadow-[0_10px_40px_-10px_rgba(0,0,0,0.45)]' : '',
      )}>
        {/* ===== Top bar — в цвет фона страницы, с логотипом и адресом ===== */}
        <div className="bg-[#053d37]">
          <div className="relative max-w-[1440px] mx-auto px-5 lg:px-8">
            <div className="flex items-center justify-between gap-4 py-1">
              {/* Слева: лого + адрес */}
              <div className="flex items-center gap-5 lg:gap-7 min-w-0">
                <Link href="/" className="shrink-0 group flex items-center">
                  <div className="relative h-7 sm:h-8 lg:h-10 w-[120px] sm:w-[138px] lg:w-[172px]">
                    <Image
                      src="/logotip.png"
                      alt="Контроль 360°"
                      fill
                      sizes="172px"
                      className="object-contain group-hover:scale-[1.03] transition-transform"
                      priority
                    />
                  </div>
                </Link>
              </div>

              {/* Мобильный телефон — напротив лого (виден только на <sm) */}
              <a
                href="tel:+79951800695"
                className="sm:hidden flex items-center gap-1.5 text-[12px] font-semibold text-white hover:text-[#7fd4bc] transition-colors whitespace-nowrap"
              >
                <Phone size={13} strokeWidth={2.5} className="text-[#7fd4bc]" />
                +7 995 180-06-95
              </a>

              {/* Справа: город · телефон · почта — все контакты только от sm+, место справа для бургер-кнопки */}
              <div className="hidden sm:flex items-center gap-3 sm:gap-4 pr-24 lg:pr-28">
                <span className="flex items-center gap-1.5 text-[13px] font-semibold text-white tracking-wide whitespace-nowrap">
                  <span className="relative flex w-1.5 h-1.5">
                    <span className="absolute inline-flex w-full h-full rounded-full bg-[#7fd4bc] opacity-70 animate-ping" />
                    <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-[#7fd4bc]" />
                  </span>
                  г. Мариуполь
                </span>
                <span className="inline-block w-px h-3 bg-white/20" />
                <a
                  href="tel:+79951800695"
                  className="flex items-center gap-1.5 text-[13px] font-semibold text-white hover:text-[#7fd4bc] transition-colors"
                >
                  <Phone size={13} strokeWidth={2.5} className="text-[#7fd4bc]" /> +7 995 180-06-95
                </a>
                <span className="inline-block w-px h-3 bg-white/20" />
                <a
                  href="mailto:katebk95@icloud.com"
                  className="flex items-center gap-1.5 text-[13px] font-semibold text-white hover:text-[#7fd4bc] transition-colors"
                >
                  <Mail size={13} strokeWidth={2.5} className="text-[#7fd4bc]" /> katebk95@icloud.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ===== Main nav — синяя полоса с меню ===== */}
        <div className="bg-[#1E40AF]">
          <div className="relative max-w-[1440px] mx-auto px-5 lg:px-8">
            <div className="flex items-center gap-5 h-11">
              <nav className="hidden lg:flex items-center gap-1 flex-1 -ml-3">
                {NAV_LINKS.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="relative px-3 py-1.5 text-[15px] font-semibold text-white rounded-lg hover:bg-white/10 transition-all after:pointer-events-none after:absolute after:left-1/2 after:-translate-x-1/2 after:bottom-0.5 after:h-[2px] after:w-0 after:rounded-full after:bg-white/80 hover:after:w-5 after:transition-all"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <SearchOverlay />

              <div className="flex items-center gap-1.5 ml-auto pr-14 lg:pr-0">
                <Link
                  href="/dashboard/favorites"
                  className="relative p-2 text-white hover:bg-white/10 rounded-xl transition-all"
                >
                  <Heart size={19} />
                </Link>

                <button
                  onClick={() => setQuoteOpen(true)}
                  className="relative p-2 text-white hover:bg-white/10 rounded-xl transition-all"
                >
                  <FileText size={19} />
                  {count > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center bg-white text-[#1E40AF] text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.35)]">
                      {count}
                    </span>
                  )}
                </button>

              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Полноэкранный StaggeredMenu — открывается по кнопке в правом верхнем углу */}
      <StaggeredMenu
        position="right"
        isFixed
        colors={['#14c296', '#1E40AF']}
        accentColor="#14c296"
        menuButtonColor="#ffffff"
        openMenuButtonColor="#053d37"
        displayItemNumbering
        displaySocials={false}
        items={NAV_LINKS.map(l => ({ label: l.label, ariaLabel: l.label, link: l.href }))}
      />

      <QuotePanel open={quoteOpen} onClose={() => setQuoteOpen(false)} />
    </>
  )
}
