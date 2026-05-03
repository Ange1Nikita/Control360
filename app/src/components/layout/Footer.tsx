'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Phone, Mail, MapPin, Clock, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const PHONES = [
  { num: '+7 (949) 863-49-58', tel: '+79498634958', label: 'Основной' },
  { num: '+7 995 180-06-95',   tel: '+79951800695', label: 'Магазин' },
  { num: '+7 (949) 851-82-17', tel: '+79498518217', label: 'Диспетчерская' },
]

const SOCIALS = [
  { name: 'ВКонтакте', href: 'https://vk.com', img: '/social/vk.png' },
  { name: 'Telegram',  href: 'https://t.me',    img: '/social/telegram.png' },
  { name: 'WhatsApp',  href: 'https://wa.me',   img: '/social/whatsapp.png' },
  { name: 'MAX',       href: 'https://max.ru',  img: '/social/max.png' },
]

export default function Footer() {
  const [categories, setCategories] = useState<{ name: string; slug: string }[]>([])
  const [phonesOpen, setPhonesOpen] = useState(false)

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(data => {
        const cats = (Array.isArray(data) ? data : [])
          .filter((c: any) => c._count?.products > 0)
          .slice(0, 8)
          .map((c: any) => ({ name: c.name, slug: c.slug }))
        setCategories(cats)
      })
      .catch(() => {})
  }, [])

  return (
    <footer className="relative z-10 overflow-hidden bg-[#053d37] text-[#7fd4bc]/90">
      {/* Свечения и сетка */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/4 w-[640px] h-[440px] rounded-full bg-[#009B76] opacity-30 blur-[140px]" />
        <div className="absolute -bottom-32 right-0 w-[520px] h-[420px] rounded-full bg-[#14c296] opacity-20 blur-[140px]" />
        <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-[380px] h-[380px] rounded-full bg-[#7fd4bc] opacity-[0.05] blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(127,212,188,1) 1px, transparent 1px), linear-gradient(90deg, rgba(127,212,188,1) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
      </div>

      <div className="relative max-w-[1440px] mx-auto px-5 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <h4 className="font-bold text-white text-sm mb-5 relative inline-block">
              Каталог
              <span className="absolute -bottom-1.5 left-0 h-[2px] w-8 rounded-full bg-gradient-to-r from-[#7fd4bc] to-[#3ce0b4]" />
            </h4>
            <div className="flex flex-col gap-2.5">
              {categories.map(item => (
                <Link
                  key={item.slug}
                  href={`/catalog?category=${item.slug}`}
                  className="group flex items-center gap-1.5 text-[13px] text-[#7fd4bc]/70 hover:text-white transition-colors w-fit"
                >
                  <span className="w-1 h-1 rounded-full bg-[#7fd4bc]/40 group-hover:bg-[#7fd4bc] transition-colors" />
                  {item.name}
                </Link>
              ))}
              {categories.length === 0 && (
                <Link href="/catalog" className="text-[13px] text-[#7fd4bc]/70 hover:text-white transition-colors">
                  Все товары
                </Link>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white text-sm mb-5 relative inline-block">
              Информация
              <span className="absolute -bottom-1.5 left-0 h-[2px] w-8 rounded-full bg-gradient-to-r from-[#7fd4bc] to-[#3ce0b4]" />
            </h4>
            <div className="flex flex-col gap-2.5">
              {[
                { label: 'О компании', href: '/about' },
                { label: 'Услуги', href: '/services' },
                { label: 'Кейсы', href: '/cases' },
                { label: 'Контакты', href: '/contacts' },
              ].map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center gap-1.5 text-[13px] text-[#7fd4bc]/70 hover:text-white transition-colors w-fit"
                >
                  <span className="w-1 h-1 rounded-full bg-[#7fd4bc]/40 group-hover:bg-[#7fd4bc] transition-colors" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white text-sm mb-5 relative inline-block">
              Контакты
              <span className="absolute -bottom-1.5 left-0 h-[2px] w-8 rounded-full bg-gradient-to-r from-[#7fd4bc] to-[#3ce0b4]" />
            </h4>
            <div className="flex flex-col gap-3">
              {/* Телефоны — выпадающий список */}
              <div>
                <button
                  type="button"
                  onClick={() => setPhonesOpen(v => !v)}
                  aria-expanded={phonesOpen}
                  className="group inline-flex items-center gap-2.5 text-[13px] text-[#7fd4bc]/70 hover:text-white transition-colors"
                >
                  <span className="w-7 h-7 shrink-0 rounded-lg bg-[#2563EB]/[0.08] backdrop-blur-xl border border-[#60A5FA]/15 flex items-center justify-center group-hover:border-[#93C5FD]/50 transition-colors">
                    <Phone size={12} className="text-[#7fd4bc]" />
                  </span>
                  <span>Телефоны</span>
                  <span className={`w-7 h-7 shrink-0 rounded-lg bg-[#7fd4bc]/15 border border-[#7fd4bc]/40 flex items-center justify-center group-hover:bg-[#7fd4bc]/25 group-hover:border-[#7fd4bc]/70 transition-all duration-300 ${phonesOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown size={16} strokeWidth={2.5} className="text-white" />
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {phonesOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <ul className="mt-2 pl-9 flex flex-col gap-2 border-l border-white/10 ml-3.5">
                        {PHONES.map(p => (
                          <li key={p.tel}>
                            <a
                              href={`tel:${p.tel}`}
                              className="group flex flex-col text-[13px] font-semibold text-white hover:text-[#7fd4bc] transition-colors leading-tight"
                            >
                              <span>{p.num}</span>
                              <span className="text-[10px] font-normal text-[#7fd4bc]/60 tracking-wide uppercase mt-0.5">{p.label}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <a
                href="mailto:katebk95@icloud.com"
                className="group flex items-center gap-2.5 text-[13px] text-[#7fd4bc]/70 hover:text-white transition-colors"
              >
                <span className="w-7 h-7 shrink-0 rounded-lg bg-[#2563EB]/[0.08] backdrop-blur-xl border border-[#60A5FA]/15 flex items-center justify-center group-hover:border-[#93C5FD]/50 transition-colors">
                  <Mail size={12} className="text-[#7fd4bc]" />
                </span>
                katebk95@icloud.com
              </a>
              <div className="flex items-center gap-2.5 text-[13px] text-[#7fd4bc]/70">
                <span className="w-7 h-7 shrink-0 rounded-lg bg-[#2563EB]/[0.08] backdrop-blur-xl border border-[#60A5FA]/15 flex items-center justify-center">
                  <Clock size={12} className="text-[#7fd4bc]" />
                </span>
                Ежедневно 8:00 — 22:00
              </div>
              <div className="flex items-start gap-2.5 text-[13px] text-[#7fd4bc]/70">
                <span className="w-7 h-7 shrink-0 rounded-lg bg-[#2563EB]/[0.08] backdrop-blur-xl border border-[#60A5FA]/15 flex items-center justify-center">
                  <MapPin size={12} className="text-[#7fd4bc]" />
                </span>
                <span>г. Мариуполь, пр-кт Металлургов, д. 121б</span>
              </div>
            </div>
          </div>

          {/* Соцсети — Оставайтесь на связи */}
          <div>
            <h4 className="font-bold text-white text-sm mb-5 relative inline-block">
              Оставайтесь на связи
              <span className="absolute -bottom-1.5 left-0 h-[2px] w-8 rounded-full bg-gradient-to-r from-[#7fd4bc] to-[#3ce0b4]" />
            </h4>
            <div className="flex flex-wrap gap-3">
              {SOCIALS.map(s => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.name}
                  title={s.name}
                  className="group relative w-11 h-11 rounded-xl overflow-hidden hover:-translate-y-0.5 hover:drop-shadow-[0_10px_20px_rgba(20,194,150,0.4)] transition-all duration-300"
                >
                  <Image
                    src={s.img}
                    alt={s.name}
                    fill
                    sizes="44px"
                    className="object-contain"
                  />
                </a>
              ))}
            </div>
            <p className="mt-4 text-[12px] text-[#7fd4bc]/55 leading-relaxed max-w-[220px]">
              Пишите нам в удобном мессенджере — ответим быстро.
            </p>
          </div>
        </div>

        <div className="mt-14 pt-6 border-t border-[#60A5FA]/15 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#7fd4bc]/50">
          <span>© 2024–{new Date().getFullYear()} Контроль 360°. Все права защищены.</span>
          <span className="flex items-center gap-2">
            <span className="relative flex w-1.5 h-1.5">
              <span className="absolute inline-flex w-full h-full rounded-full bg-[#55c8a6] opacity-70 animate-ping" />
              <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-[#7fd4bc]" />
            </span>
            Сделано в Мариуполе
          </span>
        </div>
      </div>
    </footer>
  )
}
