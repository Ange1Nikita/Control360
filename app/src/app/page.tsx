'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  ShieldCheck, Headphones, ArrowRight,
  Truck, Tag, Send,
} from 'lucide-react'
import CinematicFloorplan from '@/components/ui/CinematicFloorplan'
import ShinyText from '@/components/ui/ShinyText'
import TypedText from '@/components/ui/TypedText'

const fade = { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6 } }
const stagger = { animate: { transition: { staggerChildren: 0.1 } } }

const catalog = [
  { image: '/catalog/cameras.jpg', title: 'Камеры видеонаблюдения', desc: 'AHD · IP · Wi-Fi',       slug: 'kamery-videonablyudeniya' },
  { image: '/catalog/dvr.jpg',     title: 'Видеорегистраторы',     desc: '4 / 8 / 16 каналов',      slug: 'registratory-nvr' },
  { image: '/catalog/ptz.jpg',     title: 'Поворотные камеры PTZ', desc: 'Удалённый контроль',      slug: 'kamery-videonablyudeniya' },
  { image: '/catalog/kits.jpg',    title: 'Комплекты',             desc: 'Готовые решения',         slug: 'komplekty' },
  { image: '/catalog/monitors.jpg',title: 'Мониторы и аксессуары', desc: 'Кабели · БП · крепления', slug: 'zhyostkie-diski' },
  { image: '/catalog/services.jpg',title: 'Услуги и монтаж',       desc: 'Проектирование, установка', slug: 'services' },
]

const features = [
  { icon: Truck, title: 'Быстрая доставка', desc: 'по всей России' },
  { icon: Tag, title: 'Выгодные цены', desc: 'прямые поставки' },
  { icon: ShieldCheck, title: 'Гарантия качества', desc: 'только оригинал' },
  { icon: Headphones, title: 'Техподдержка', desc: '24/7 онлайн' },
]

const solutions = [
  {
    tag: 'Реализованный проект',
    title: '4 IP-камеры на частный дом',
    desc: 'Периметровый комплекс под ключ: контроль въезда, двора и задней стены участка. Ночная съёмка в полном цвете, уведомления на смартфон при движении.',
    image: '/solutions/home.png',
    specs: [
      ['Оборудование', '4 IP-камеры + NVR 4 кан.'],
      ['Разрешение',   '4 Мп · IP67'],
      ['Ночная съёмка','ИК до 30 м'],
      ['Архив',        '14 дней'],
      ['Доступ',       'Mobile + Web'],
    ],
    price: 'от 75 000 ₽',
  },
  {
    tag: 'Реализованный проект',
    title: '4 IP-камеры в кафе',
    desc: 'Контроль зала, касс и зоны выдачи. Чёткая картинка в условиях смешанного освещения, разграничение доступа для персонала.',
    image: '/solutions/cafe.png',
    specs: [
      ['Оборудование', '4 IP-камеры + NVR 4 кан.'],
      ['Разрешение',   '4 Мп'],
      ['Обзор',        '110°'],
      ['Архив',        '30 дней'],
      ['Удалённый просмотр', 'Да'],
    ],
    price: 'от 82 000 ₽',
  },
  {
    tag: 'Реализованный проект',
    title: '8 IP-камер на склад',
    desc: 'Периметр, рампы и рабочие зоны. Аналитика движения и пересечения линий, интеграция с системой контроля доступа.',
    image: '/solutions/warehouse.png',
    specs: [
      ['Оборудование', '8 IP-камер + NVR 8 кан.'],
      ['Разрешение',   '8 Мп · IP67'],
      ['Обзор',        '110°'],
      ['Архив',        '60 дней'],
      ['Аналитика',    'Движение, линии'],
    ],
    price: 'от 185 000 ₽',
  },
]

export default function HomePage() {
  const [h1Done, setH1Done] = useState(false)
  const [pDone, setPDone] = useState(false)

  return (
    <div className="relative">

      {/* Группа «Hero + Каталог» — на десктопе занимает всю видимую область минус шапку */}
      <div className="lg:flex lg:flex-col lg:min-h-[calc(100vh-96px)]">

      {/* ===== HERO — текст слева, планировка справа ===== */}
      <section className="relative lg:flex-1 lg:flex lg:flex-col lg:justify-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[620px] h-[620px] bg-[#14c296] rounded-full opacity-25 blur-[140px] translate-x-1/4 -translate-y-1/4" />
          <div className="absolute bottom-0 left-1/4 w-[420px] h-[420px] bg-[#009B76] rounded-full opacity-35 blur-[120px]" />
          <div className="absolute top-1/3 left-10 w-[260px] h-[260px] bg-[#7fd4bc] rounded-full opacity-[0.08] blur-[110px]" />
        </div>

        {/* ===== ИЗЮМИНКА HERO — аврора + дышащее ядро + тонкие горизонты ===== */}
        {/* Маска сверху-вниз: свечение плотное в верхней части и плавно гаснет к низу секции */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
          style={{
            maskImage:
              'linear-gradient(to bottom, black 0%, black 45%, rgba(0,0,0,0.75) 65%, rgba(0,0,0,0.35) 82%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to bottom, black 0%, black 45%, rgba(0,0,0,0.75) 65%, rgba(0,0,0,0.35) 82%, transparent 100%)',
          }}
        >
          {/* Аврора: огромное conic-свечение, медленно вращается против часовой */}
          <motion.div
            className="absolute left-1/2 top-1/2 w-[1500px] h-[1500px] -translate-x-1/2 -translate-y-1/2 opacity-[0.22] mix-blend-screen"
            style={{
              background:
                'conic-gradient(from 0deg at 50% 50%, transparent 0%, #14c296 16%, #3ce0b4 30%, transparent 46%, #009B76 60%, #7fd4bc 76%, transparent 92%, transparent 100%)',
              filter: 'blur(90px)',
            }}
            animate={{ rotate: -360 }}
            transition={{ duration: 55, repeat: Infinity, ease: 'linear' }}
          />

          {/* Встречное мягкое свечение — двойной слой даёт «живое» сияние */}
          <motion.div
            className="absolute left-1/2 top-1/2 w-[1100px] h-[1100px] -translate-x-1/2 -translate-y-1/2 opacity-[0.14] mix-blend-screen"
            style={{
              background:
                'conic-gradient(from 180deg at 50% 50%, transparent 0%, #3ce0b4 20%, transparent 40%, #0fe0a8 65%, transparent 85%)',
              filter: 'blur(80px)',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 38, repeat: Infinity, ease: 'linear' }}
          />

          {/* Дышащее ядро под заголовком слева */}
          <motion.div
            className="absolute left-[22%] top-[52%] w-[380px] h-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#3ce0b4] blur-[120px]"
            animate={{ opacity: [0.12, 0.3, 0.12], scale: [1, 1.12, 1] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Тонкий «горизонт» — переливающаяся световая линия */}
          <motion.div
            className="absolute left-0 right-0 top-[46%] h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(127,212,188,0.55) 45%, rgba(60,224,180,0.8) 50%, rgba(127,212,188,0.55) 55%, transparent 100%)',
            }}
            animate={{ opacity: [0.35, 0.9, 0.35] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <div className="relative w-full max-w-[1440px] mx-auto px-5 lg:px-8 pt-4 pb-10 lg:py-8">
          <div className="grid lg:grid-cols-[38%_1fr] gap-8 items-center min-h-[420px] lg:min-h-0">
            <motion.div {...fade}>
              <TypedText
                as="h1"
                className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.08] tracking-tight text-white min-h-[4.3em]"
                text={'Комплексные системы\nбезопасности\nи\u00a0диспетчеризации\nг.\u00a0Мариуполь'}
                speed={40}
                startDelay={250}
                showCursor
                onComplete={() => setH1Done(true)}
              />

              <TypedText
                as="p"
                className="mt-6 text-white/85 text-[15px] leading-relaxed min-h-[3em]"
                text={'Профессиональное оборудование для дома,\nбизнеса и промышленных объектов'}
                speed={28}
                startDelay={350}
                active={h1Done}
                showCursor
                cursorOnDone
                onComplete={() => setPDone(true)}
              />

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/consultation"
                  className="group relative inline-flex items-center overflow-hidden px-6 py-3 rounded-xl bg-[#1E40AF] text-sm font-bold transition-all duration-300
                    shadow-[0_8px_24px_-8px_rgba(30,64,175,0.6),0_0_0_1px_rgba(96,165,250,0.18),inset_0_1px_0_rgba(255,255,255,0.14)]
                    hover:bg-[#2549c2] hover:-translate-y-0.5
                    hover:shadow-[0_14px_36px_-8px_rgba(30,64,175,0.8),0_0_0_1px_rgba(147,197,253,0.35),inset_0_1px_0_rgba(255,255,255,0.22)]"
                >
                  {/* Тонкий «стеклянный» блик сверху */}
                  <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/[0.12] to-transparent" />
                  {/* Бегущий shimmer при наведении */}
                  <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
                    <span className="absolute top-0 -left-1/2 h-full w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12 opacity-0 group-hover:opacity-100 group-hover:translate-x-[400%] transition-all duration-1000 ease-out" />
                  </span>
                  <span className="relative">
                    <ShinyText
                      text="Получить консультацию"
                      color="#94a3b8"
                      shineColor="#ffffff"
                      speed={2}
                      spread={100}
                    />
                  </span>
                </Link>
                <Link
                  href="/calculate"
                  className="inline-flex items-center px-6 py-3 rounded-xl bg-white/[0.06] backdrop-blur-xl border border-white/20 text-white text-sm font-semibold hover:bg-white/[0.12] hover:border-white/40 transition-all"
                >
                  Рассчитать стоимость
                </Link>
              </div>

              {/* Метрики доверия */}
              <motion.div
                {...fade}
                transition={{ delay: 0.35, duration: 0.6 }}
                className="mt-10 grid grid-cols-3 max-w-md"
              >
                {[
                  { title: '1000+', desc: 'довольных клиентов' },
                  { title: '10+',   desc: 'лет опыта' },
                  { title: '24/7',  desc: 'поддержка' },
                ].map((b, i) => (
                  <div
                    key={i}
                    className={`px-4 lg:px-6 ${i > 0 ? 'border-l border-white/20' : ''}`}
                  >
                    <div className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight whitespace-nowrap leading-none">
                      {b.title}
                    </div>
                    <div className="mt-2 text-[11px] uppercase tracking-[0.16em] text-white/55 leading-tight">
                      {b.desc}
                    </div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div {...fade} transition={{ delay: 0.2, duration: 0.6 }} className="hidden lg:block w-full h-[500px] relative z-[2]">
              <div className="relative w-full h-full rounded-2xl overflow-hidden bg-gradient-to-br from-[#0F1C55] via-[#1E40AF] to-[#3B82F6] shadow-[0_40px_100px_-30px_rgba(37,99,235,0.55),inset_0_0_0_1px_rgba(96,165,250,0.18)]">
                <CinematicFloorplan active={pDone} />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== КАТАЛОГ ОБОРУДОВАНИЯ — премиальные карточки с фото ===== */}
      <section className="relative pt-2 lg:pt-4 pb-3 lg:pb-4">
        {/* Перетекающее свечение из hero — плавный, мягкий переход без видимого стыка */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-0">
          <div className="absolute -top-80 left-[18%] w-[760px] h-[620px] rounded-full bg-[#009B76] opacity-30 blur-[170px]" />
          <div className="absolute -top-56 right-[18%] w-[620px] h-[520px] rounded-full bg-[#14c296] opacity-22 blur-[160px]" />
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[480px] h-[340px] rounded-full bg-[#7fd4bc] opacity-[0.09] blur-[130px]" />
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[900px] h-[220px] rounded-full bg-[#14c296] opacity-[0.06] blur-[120px]" />
        </div>

        <div className="relative max-w-[1440px] mx-auto px-5 lg:px-8">
          {/* Шапка секции */}
          <motion.div {...fade} className="flex flex-col items-center text-center mb-8">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-white">
              Каталог оборудования
            </h2>
            <p className="mt-3 max-w-xl text-white/60 text-[15px] leading-relaxed">
              От отдельных камер до готовых комплексов — подберём оборудование под задачу, площадь и бюджет.
            </p>
          </motion.div>

          {/* Карточки с фото — все 6 в одну линию на больших экранах */}
          <motion.div
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-5"
          >
            {catalog.map((item, i) => (
              <motion.div key={i} variants={fade}>
                <Link
                  href={`/catalog?category=${item.slug}`}
                  className="group relative flex flex-col h-full rounded-2xl overflow-hidden bg-white/[0.04] backdrop-blur-xl border border-white/10 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.6)] hover:border-white/25 hover:-translate-y-1.5 hover:shadow-[0_30px_80px_-20px_rgba(20,194,150,0.25)] transition-all duration-500"
                >
                  {/* Фото — квадрат фиксированного размера. Товары — на белом паспарту (contain), сюжетное фото услуг — во всю карточку (cover) */}
                  <div className={`relative aspect-square overflow-hidden ${item.slug === 'services' ? 'bg-[#031c14]' : 'bg-white'}`}>
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                      className={`transition-transform duration-700 group-hover:scale-[1.05] ${item.slug === 'services' ? 'object-cover' : 'object-contain p-4'}`}
                    />
                  </div>

                  {/* Контент */}
                  <div className="relative flex flex-col flex-1 p-4 border-t border-white/10">
                    <h3 className="text-white font-bold text-[13px] leading-tight min-h-[2.6em]">{item.title}</h3>
                    <p className="mt-1 text-white/50 text-[11px] leading-relaxed">{item.desc}</p>

                    <span className="mt-3 inline-flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-lg bg-[#1E40AF] text-white text-[12px] font-semibold shadow-[0_6px_18px_-6px_rgba(30,64,175,0.55)] group-hover:bg-[#2549c2] group-hover:shadow-[0_10px_28px_-6px_rgba(30,64,175,0.8)] transition-all duration-300">
                      Смотреть
                      <ArrowRight size={13} strokeWidth={2.5} className="transition-transform duration-500 group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      </div>
      {/* /Группа «Hero + Каталог» */}

      {/* ===== НАШИ РЕШЕНИЯ — реализованные проекты в zigzag-layout ===== */}
      <section className="relative py-10 lg:py-14">
        <div className="relative max-w-[1440px] mx-auto px-5 lg:px-8">
          <motion.div {...fade} className="flex flex-col items-center text-center mb-10 lg:mb-14">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] backdrop-blur-xl border border-white/10 text-[11px] font-semibold tracking-[0.14em] uppercase text-white/70">
              Портфолио
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-white">
              Наши решения
            </h2>
            <p className="mt-3 max-w-xl text-white/60 text-[15px] leading-relaxed">
              Несколько проектов, которые мы реализовали «под ключ» — от подбора оборудования до настройки.
            </p>
          </motion.div>

          <div className="flex flex-col gap-14 lg:gap-20">
            {solutions.map((p, i) => {
              const reverse = i % 2 === 1
              return (
                <motion.article
                  key={i}
                  variants={fade}
                  initial="initial"
                  whileInView="animate"
                  viewport={{ once: true, amount: 0.2 }}
                  className={`grid lg:grid-cols-2 gap-8 lg:gap-14 items-center ${reverse ? 'lg:[&>*:first-child]:order-2' : ''}`}
                >
                  {/* Текст + характеристики */}
                  <div>
                    <span className="inline-block text-[11px] font-semibold tracking-[0.16em] uppercase text-[#7fd4bc]">
                      {p.tag}
                    </span>
                    <h3 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.05] tracking-tight text-white">
                      {p.title}
                    </h3>
                    <p className="mt-4 text-white/65 text-[15px] leading-relaxed max-w-xl">
                      {p.desc}
                    </p>

                    <dl className="mt-8 grid grid-cols-1 gap-y-3">
                      {p.specs.map(([label, value], k) => (
                        <div key={k} className="grid grid-cols-[150px_1fr] items-baseline gap-4 py-1.5 border-b border-white/10">
                          <dt className="text-white/50 text-[13px]">{label}</dt>
                          <dd className="text-white font-semibold text-[14px]">{value}</dd>
                        </div>
                      ))}
                    </dl>

                    <div className="mt-8 flex items-end flex-wrap gap-4">
                      <div>
                        <div className="text-white/50 text-[12px] uppercase tracking-[0.14em]">Стоимость</div>
                        <div className="mt-1 text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                          {p.price}
                        </div>
                      </div>
                    </div>

                    <Link
                      href="/calculate"
                      className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#14c296] to-[#3ce0b4] text-white text-sm font-bold shadow-[0_10px_40px_-10px_rgba(20,194,150,0.7)] hover:shadow-[0_14px_50px_-10px_rgba(20,194,150,0.85)] hover:-translate-y-0.5 transition-all"
                    >
                      Рассчитать проект
                      <ArrowRight size={16} strokeWidth={2.5} />
                    </Link>
                  </div>

                  {/* Фото — показываем полностью, без обрезки, на белом паспарту */}
                  <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.65)] group bg-white">
                    <div className="relative aspect-[4/3]">
                      <Image
                        src={p.image}
                        alt={p.title}
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-contain transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                    </div>
                  </div>
                </motion.article>
              )
            })}
          </div>
        </div>
      </section>

      {/* ===== FEATURE-STRIP — плюшки + подписка (финальный блок перед футером) ===== */}
      <section className="relative py-10 lg:py-14">
        <div className="relative max-w-[1440px] mx-auto px-5 lg:px-8">
          <motion.div
            {...fade}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#04271c]/90 via-[#03201a]/90 to-[#04271c]/90 backdrop-blur-xl border border-white/10 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.6)]"
          >
            {/* Декоративное свечение внутри панели */}
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="absolute -top-24 left-10 w-[420px] h-[280px] rounded-full bg-[#14c296] opacity-20 blur-[120px]" />
              <div className="absolute -bottom-28 right-10 w-[480px] h-[300px] rounded-full bg-[#3ce0b4] opacity-[0.14] blur-[130px]" />
              <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(127,212,188,1) 1px, transparent 1px), linear-gradient(90deg, rgba(127,212,188,1) 1px, transparent 1px)',
                  backgroundSize: '48px 48px',
                }}
              />
            </div>

            <div className="relative grid lg:grid-cols-[1.5fr_1fr] gap-8 lg:gap-12 items-center p-6 lg:p-10">
              {/* 4 плюшки */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-7">
                {features.map((f, i) => (
                  <div key={i} className="flex items-start gap-3.5">
                    <div className="relative shrink-0 w-11 h-11 rounded-xl bg-white/[0.04] border border-white/15 flex items-center justify-center transition-colors">
                      <f.icon size={19} className="text-[#7fd4bc]" strokeWidth={2} />
                    </div>
                    <div className="min-w-0 leading-tight pt-1">
                      <div className="text-white font-bold text-[14px]">{f.title}</div>
                      <div className="text-white/50 text-[12px] mt-1">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Форма подписки */}
              <div className="lg:border-l lg:border-white/10 lg:pl-10">
                <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#7fd4bc] mb-2">
                  Рассылка
                </div>
                <div className="text-white font-extrabold text-[18px] leading-tight mb-4">
                  Подпишитесь на новости и акции
                </div>
                <form
                  onSubmit={(e) => e.preventDefault()}
                  className="flex items-center gap-2 rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/15 p-1.5 focus-within:border-[#3ce0b4]/60 transition-colors"
                >
                  <input
                    type="email"
                    placeholder="Ваш e-mail"
                    className="flex-1 min-w-0 bg-transparent outline-none px-3 py-2.5 text-sm text-white placeholder:text-white/40"
                  />
                  <button
                    type="submit"
                    className="shrink-0 inline-flex items-center gap-2 px-4 h-11 rounded-xl bg-gradient-to-r from-[#14c296] to-[#3ce0b4] text-white text-sm font-semibold shadow-[0_10px_28px_-8px_rgba(20,194,150,0.7)] hover:-translate-y-0.5 hover:shadow-[0_14px_36px_-8px_rgba(20,194,150,0.85)] transition-all"
                  >
                    <span className="hidden sm:inline">Подписаться</span>
                    <Send size={15} strokeWidth={2.5} />
                  </button>
                </form>
                <p className="mt-3 text-[11px] text-white/40 leading-relaxed">
                  Раз в месяц — новости, скидки и обзоры оборудования. Без спама.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
