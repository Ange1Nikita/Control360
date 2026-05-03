'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Wrench, HardDrive, Battery, Plus, Minus, Check } from 'lucide-react'

// ──────────────── Общие UI ────────────────
type Tab = 'mount' | 'archive' | 'ups'

const TABS: { id: Tab; icon: typeof Wrench; title: string; sub: string }[] = [
  { id: 'mount',   icon: Wrench,    title: 'Стоимость монтажных работ', sub: 'Расчёт под ваш объект' },
  { id: 'archive', icon: HardDrive, title: 'Объём архива видеонаблюдения', sub: 'Подбор диска/NVR' },
  { id: 'ups',     icon: Battery,   title: 'Работа от АКБ',             sub: 'Время автономии' },
]

function Counter({ value, onChange, min = 0, max = 999 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-xl bg-white/[0.05] border border-white/15 backdrop-blur-xl p-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-8 h-8 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center"
        aria-label="−"
      >
        <Minus size={15} />
      </button>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={e => {
          const n = Number(e.target.value)
          if (!Number.isFinite(n)) return
          onChange(Math.min(max, Math.max(min, Math.round(n))))
        }}
        className="w-12 bg-transparent text-center text-white font-semibold text-[14px] outline-none"
      />
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-8 h-8 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center"
        aria-label="+"
      >
        <Plus size={15} />
      </button>
    </div>
  )
}

function Row({ label, desc, right }: { label: string; desc?: string; right: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-white/8 last:border-b-0">
      <div className="min-w-0">
        <div className="text-white text-[14px] font-semibold leading-tight">{label}</div>
        {desc && <div className="text-white/55 text-[12px] mt-0.5 leading-relaxed">{desc}</div>}
      </div>
      <div className="shrink-0">{right}</div>
    </div>
  )
}

function Toggle({ value, onChange, label, desc }: { value: boolean; onChange: (v: boolean) => void; label: string; desc?: string }) {
  return (
    <Row
      label={label}
      desc={desc}
      right={
        <button
          type="button"
          role="switch"
          aria-checked={value}
          onClick={() => onChange(!value)}
          className={`relative w-12 h-7 rounded-full border transition-colors ${value ? 'bg-[#14c296] border-[#14c296]' : 'bg-white/5 border-white/20'}`}
        >
          <span className={`absolute top-0.5 ${value ? 'left-6' : 'left-0.5'} w-6 h-6 rounded-full bg-white shadow-[0_4px_10px_-2px_rgba(0,0,0,0.45)] transition-all`} />
        </button>
      }
    />
  )
}

function SegButtons<T extends string | number>({ options, value, onChange }: { options: { v: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-xl bg-white/[0.05] border border-white/15 backdrop-blur-xl p-1">
      {options.map(o => (
        <button
          key={String(o.v)}
          type="button"
          onClick={() => onChange(o.v)}
          className={`px-3 h-8 rounded-lg text-[13px] font-semibold transition-all ${value === o.v ? 'bg-[#1E40AF] text-white shadow-[0_4px_12px_-4px_rgba(30,64,175,0.7)]' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function formatRub(n: number) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(n)) + ' ₽'
}

// ──────────────── КАЛЬКУЛЯТОР МОНТАЖНЫХ РАБОТ ────────────────
interface MountItem { key: string; label: string; desc?: string; price: number }
const MOUNT_ITEMS: MountItem[] = [
  { key: 'ipcam_bullet', label: 'Монтаж IP-камеры (bullet/dome)', desc: 'Крепёж, подключение, настройка', price: 2800 },
  { key: 'ipcam_ptz',    label: 'Монтаж PTZ-камеры',             desc: 'Поворотная купольная', price: 4500 },
  { key: 'ipcam_analog', label: 'Монтаж аналоговой камеры',       desc: 'AHD / CVI / TVI', price: 2200 },
  { key: 'nvr',          label: 'Установка NVR/DVR',              desc: 'Прошивка, настройка каналов', price: 3000 },
  { key: 'switch',       label: 'Монтаж PoE-коммутатора',         price: 1500 },
  { key: 'reader',       label: 'Установка считывателя СКУД',     price: 2500 },
  { key: 'maglock',      label: 'Монтаж электромагнитного замка', price: 3500 },
  { key: 'ir_motion',    label: 'Датчик движения / дыма / открытия', price: 800 },
  { key: 'intercom',     label: 'Домофон / вызывная панель',      price: 3800 },
  { key: 'siren',        label: 'Сирена / оповещатель',           price: 900 },
]

const CABLE_TYPES = [
  { v: 'open',   label: 'Открытая прокладка', mult: 1 },
  { v: 'gofra',  label: 'В гофре',             mult: 1.25 },
  { v: 'cable_channel', label: 'В кабель-канале', mult: 1.35 },
  { v: 'shtroba', label: 'В штробе',          mult: 1.75 },
] as const

function MountCalc() {
  const [qty, setQty] = useState<Record<string, number>>({})
  const [utp, setUtp] = useState(0)
  const [power, setPower] = useState(0)
  const [cableType, setCableType] = useState<typeof CABLE_TYPES[number]['v']>('gofra')
  const [holes, setHoles] = useState(0)
  const [high, setHigh] = useState(false)
  const [project, setProject] = useState(false)
  const [commission, setCommission] = useState(false)

  const equipCost = MOUNT_ITEMS.reduce((s, it) => s + (qty[it.key] || 0) * it.price, 0)
  const cableBase = utp * 80 + power * 120
  const cableMult = CABLE_TYPES.find(c => c.v === cableType)?.mult ?? 1
  const cableCost = cableBase * cableMult
  const holeCost = holes * 450
  const baseTotal = equipCost + cableCost + holeCost
  const highCost = high ? baseTotal * 0.2 : 0
  const projectCost = project ? baseTotal * 0.08 : 0
  const commissionCost = commission ? baseTotal * 0.10 : 0
  const total = baseTotal + highCost + projectCost + commissionCost

  return (
    <div className="grid lg:grid-cols-[1.3fr_1fr] gap-6 lg:gap-8">
      {/* Форма */}
      <div className="space-y-6">
        <section>
          <h3 className="text-[12px] uppercase tracking-[0.14em] font-semibold text-[#7fd4bc] mb-3">Оборудование</h3>
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 px-5">
            {MOUNT_ITEMS.map(it => (
              <Row
                key={it.key}
                label={it.label}
                desc={`${it.desc ? it.desc + ' · ' : ''}от ${formatRub(it.price)} / шт`}
                right={<Counter value={qty[it.key] || 0} onChange={v => setQty(q => ({ ...q, [it.key]: v }))} />}
              />
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-[12px] uppercase tracking-[0.14em] font-semibold text-[#7fd4bc] mb-3">Кабельные работы</h3>
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 px-5">
            <Row
              label="Прокладка UTP / витой пары"
              desc="от 80 ₽ / м"
              right={<Counter value={utp} onChange={setUtp} max={9999} />}
            />
            <Row
              label="Прокладка силового кабеля"
              desc="от 120 ₽ / м"
              right={<Counter value={power} onChange={setPower} max={9999} />}
            />
            <Row
              label="Тип прокладки"
              desc="Влияет на коэффициент сложности"
              right={<SegButtons options={CABLE_TYPES.map(c => ({ v: c.v, label: c.label }))} value={cableType} onChange={setCableType} />}
            />
            <Row
              label="Бурение стен / проходов"
              desc="от 450 ₽ / проход"
              right={<Counter value={holes} onChange={setHoles} max={999} />}
            />
          </div>
        </section>

        <section>
          <h3 className="text-[12px] uppercase tracking-[0.14em] font-semibold text-[#7fd4bc] mb-3">Дополнительно</h3>
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 px-5">
            <Toggle value={high} onChange={setHigh} label="Высотные работы" desc="+20% к сумме монтажа (выше 3 м)" />
            <Toggle value={project} onChange={setProject} label="Проектирование" desc="+8% — схема, спецификация" />
            <Toggle value={commission} onChange={setCommission} label="Пусконаладка и настройка ПО" desc="+10% — удалённый доступ, аналитика" />
          </div>
        </section>
      </div>

      {/* Итог */}
      <Summary
        rows={[
          { label: 'Оборудование (монтаж)', value: equipCost },
          { label: 'Кабельные работы',     value: cableCost },
          { label: 'Бурение стен',         value: holeCost },
          ...(highCost       > 0 ? [{ label: 'Высотные работы',  value: highCost }]       : []),
          ...(projectCost    > 0 ? [{ label: 'Проектирование',   value: projectCost }]    : []),
          ...(commissionCost > 0 ? [{ label: 'Пусконаладка',     value: commissionCost }] : []),
        ]}
        total={total}
        totalLabel="Итого по монтажу · от"
        totalPrefix="от"
        note="Все цены в калькуляторе — стартовые («от»). Итоговая стоимость уточняется после выезда инженера и зависит от объекта, сложности прокладки и высоты монтажа."
      />
    </div>
  )
}

// ──────────────── КАЛЬКУЛЯТОР ОБЪЁМА АРХИВА ────────────────
function ArchiveCalc() {
  const [cameras, setCameras] = useState(4)
  const [mp, setMp] = useState<1 | 2 | 4 | 8>(2)
  const [fps, setFps] = useState<12 | 15 | 20 | 25>(25)
  const [codec, setCodec] = useState<'H.264' | 'H.265'>('H.265')
  const [days, setDays] = useState(14)

  const result = useMemo(() => {
    // Базовый битрейт 2Мп, 25fps, H.264 = 4 Мбит/с
    const resFactor = { 1: 0.5, 2: 1, 4: 1.7, 8: 3 }[mp]
    const fpsFactor = { 12: 0.55, 15: 0.7, 20: 0.85, 25: 1 }[fps]
    const codecFactor = codec === 'H.265' ? 0.5 : 1
    const bitrateMbps = 4 * resFactor * fpsFactor * codecFactor // на одну камеру
    const perDayGbPerCam = (bitrateMbps * 86400) / (8 * 1024)   // мегабит→мегабайт→гигабайт
    const totalGb = perDayGbPerCam * days * cameras
    return { bitrateMbps, perDayGbPerCam, totalGb }
  }, [cameras, mp, fps, codec, days])

  return (
    <div className="grid lg:grid-cols-[1.3fr_1fr] gap-6 lg:gap-8">
      <div className="space-y-6">
        <section>
          <h3 className="text-[12px] uppercase tracking-[0.14em] font-semibold text-[#7fd4bc] mb-3">Камеры</h3>
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 px-5">
            <Row label="Количество камер" desc="Общее число подключаемых" right={<Counter value={cameras} onChange={setCameras} max={999} />} />
            <Row
              label="Разрешение"
              right={<SegButtons
                options={[{ v: 1, label: '1 Мп' }, { v: 2, label: '2 Мп' }, { v: 4, label: '4 Мп' }, { v: 8, label: '8 Мп' }]}
                value={mp}
                onChange={(v) => setMp(v as 1 | 2 | 4 | 8)}
              />}
            />
            <Row
              label="Частота кадров"
              right={<SegButtons
                options={[{ v: 12, label: '12 к/с' }, { v: 15, label: '15 к/с' }, { v: 20, label: '20 к/с' }, { v: 25, label: '25 к/с' }]}
                value={fps}
                onChange={(v) => setFps(v as 12 | 15 | 20 | 25)}
              />}
            />
            <Row
              label="Кодек"
              desc="H.265 экономит до 50% объёма"
              right={<SegButtons
                options={[{ v: 'H.264', label: 'H.264' }, { v: 'H.265', label: 'H.265' }]}
                value={codec}
                onChange={(v) => setCodec(v as 'H.264' | 'H.265')}
              />}
            />
          </div>
        </section>

        <section>
          <h3 className="text-[12px] uppercase tracking-[0.14em] font-semibold text-[#7fd4bc] mb-3">Архив</h3>
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 px-5">
            <Row
              label="Глубина архива"
              desc="Дней непрерывной записи"
              right={<Counter value={days} onChange={setDays} min={1} max={365} />}
            />
          </div>
        </section>
      </div>

      <Summary
        rows={[
          { label: 'Битрейт на камеру', value: `${result.bitrateMbps.toFixed(1)} Мбит/с`, raw: true },
          { label: 'Объём в сутки на камеру', value: `${result.perDayGbPerCam.toFixed(1)} ГБ`, raw: true },
          { label: 'Камер',                 value: `${cameras}`, raw: true },
          { label: 'Глубина',               value: `${days} дн.`, raw: true },
        ]}
        customTotal={
          <>
            <div className="text-[12px] uppercase tracking-[0.14em] text-white/55">Потребуется</div>
            <div className="mt-2 text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              {(result.totalGb / 1024).toFixed(1)} <span className="text-[#7fd4bc]">ТБ</span>
            </div>
            <div className="mt-1 text-[13px] text-white/60">≈ {Math.round(result.totalGb).toLocaleString('ru-RU')} ГБ полезного дискового пространства</div>
          </>
        }
        note="Расчёт по среднему битрейту для статичной сцены. Реальный объём может отличаться на ±20% в зависимости от динамики сцены."
      />
    </div>
  )
}

// ──────────────── КАЛЬКУЛЯТОР РАБОТЫ ОТ АКБ ────────────────
const BATTERY_TYPES = [
  { v: 'agm',     label: 'AGM',      dod: 0.5,  desc: 'Кислотный, глубина разряда 50%' },
  { v: 'gel',     label: 'GEL',      dod: 0.6,  desc: 'Гелевый, до 60% разряда' },
  { v: 'lifepo4', label: 'LiFePO₄',  dod: 0.9,  desc: 'Литий-железо-фосфат, до 90%' },
] as const

function UpsCalc() {
  const [watt, setWatt] = useState(60)
  const [voltage, setVoltage] = useState<12 | 24>(12)
  const [capacity, setCapacity] = useState(72)
  const [battType, setBattType] = useState<typeof BATTERY_TYPES[number]['v']>('agm')

  const result = useMemo(() => {
    const t = BATTERY_TYPES.find(b => b.v === battType)!
    const eff = 0.85 // КПД преобразования
    const current = watt / voltage // A
    const usableCapacity = capacity * t.dod * eff // А·ч с учётом DoD и КПД
    const hours = current > 0 ? usableCapacity / current : 0
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return { current, usableCapacity, hours, h, m }
  }, [watt, voltage, capacity, battType])

  return (
    <div className="grid lg:grid-cols-[1.3fr_1fr] gap-6 lg:gap-8">
      <div className="space-y-6">
        <section>
          <h3 className="text-[12px] uppercase tracking-[0.14em] font-semibold text-[#7fd4bc] mb-3">Нагрузка</h3>
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 px-5">
            <Row
              label="Потребляемая мощность"
              desc="Суммарно по всем устройствам, Вт"
              right={
                <input
                  type="number"
                  min={0}
                  value={watt}
                  onChange={e => setWatt(Math.max(0, Number(e.target.value) || 0))}
                  className="w-28 h-10 rounded-xl bg-white/[0.05] border border-white/15 text-white text-center font-semibold outline-none focus:border-[#7fd4bc]/60 transition-colors"
                />
              }
            />
            <Row
              label="Напряжение системы"
              right={<SegButtons
                options={[{ v: 12, label: '12 В' }, { v: 24, label: '24 В' }]}
                value={voltage}
                onChange={v => setVoltage(v as 12 | 24)}
              />}
            />
          </div>
        </section>

        <section>
          <h3 className="text-[12px] uppercase tracking-[0.14em] font-semibold text-[#7fd4bc] mb-3">Аккумулятор</h3>
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 px-5">
            <Row
              label="Ёмкость АКБ"
              desc="Ампер-часов (А·ч)"
              right={
                <input
                  type="number"
                  min={0}
                  value={capacity}
                  onChange={e => setCapacity(Math.max(0, Number(e.target.value) || 0))}
                  className="w-28 h-10 rounded-xl bg-white/[0.05] border border-white/15 text-white text-center font-semibold outline-none focus:border-[#7fd4bc]/60 transition-colors"
                />
              }
            />
            <Row
              label="Тип аккумулятора"
              desc={BATTERY_TYPES.find(b => b.v === battType)?.desc}
              right={<SegButtons
                options={BATTERY_TYPES.map(b => ({ v: b.v, label: b.label }))}
                value={battType}
                onChange={(v) => setBattType(v as typeof battType)}
              />}
            />
          </div>
        </section>
      </div>

      <Summary
        rows={[
          { label: 'Ток потребления',        value: `${result.current.toFixed(2)} А`,          raw: true },
          { label: 'Полезная ёмкость',        value: `${result.usableCapacity.toFixed(1)} А·ч`, raw: true },
          { label: 'С учётом КПД',            value: '85%',                                    raw: true },
        ]}
        customTotal={
          <>
            <div className="text-[12px] uppercase tracking-[0.14em] text-white/55">Автономия</div>
            <div className="mt-2 text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              {result.h} <span className="text-[#7fd4bc] text-3xl">ч</span>{' '}
              {result.m.toString().padStart(2, '0')} <span className="text-[#7fd4bc] text-3xl">мин</span>
            </div>
            <div className="mt-1 text-[13px] text-white/60">≈ {result.hours.toFixed(1)} часов непрерывной работы</div>
          </>
        }
        note="Для критичных систем закладывайте запас минимум 30% — реальная ёмкость АКБ падает со временем и при низких температурах."
      />
    </div>
  )
}

// ──────────────── Сводная карточка ────────────────
interface SummaryRow { label: string; value: number | string; raw?: boolean }

function Summary({
  rows,
  total,
  totalLabel,
  totalPrefix,
  customTotal,
  note,
}: {
  rows: SummaryRow[]
  total?: number
  totalLabel?: string
  totalPrefix?: string
  customTotal?: React.ReactNode
  note?: string
}) {
  return (
    <div className="lg:sticky lg:top-[120px] h-fit">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F1C55] via-[#1E40AF] to-[#3B82F6] border border-[#60A5FA]/25 shadow-[0_40px_100px_-30px_rgba(37,99,235,0.55)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#2563EB] rounded-full opacity-30 blur-[90px]" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#7fd4bc] rounded-full opacity-20 blur-[100px]" />

        <div className="relative p-6 lg:p-8">
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/55 mb-1">Предварительная оценка</div>
          <div className="text-white font-extrabold text-[18px] leading-tight">Итог расчёта</div>

          <div className="mt-5 flex flex-col gap-2">
            {rows.map((r, i) => (
              <div key={i} className="flex items-center justify-between gap-3 text-[13px]">
                <span className="text-white/65">{r.label}</span>
                <span className="text-white font-semibold">
                  {r.raw ? r.value : formatRub(r.value as number)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-5 border-t border-white/15">
            {customTotal ? (
              customTotal
            ) : (
              <>
                <div className="text-[12px] uppercase tracking-[0.14em] text-white/55">{totalLabel || 'Итого'}</div>
                <div className="mt-2 text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
                  {totalPrefix && <span className="text-white/55 text-3xl mr-1 align-top">{totalPrefix}</span>}
                  {formatRub(total || 0)}
                </div>
              </>
            )}
          </div>

          <Link
            href="/consultation"
            className="group mt-6 inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-gradient-to-r from-[#14c296] to-[#3ce0b4] text-white font-bold shadow-[0_10px_28px_-8px_rgba(20,194,150,0.7)] hover:shadow-[0_14px_36px_-8px_rgba(20,194,150,0.9)] hover:-translate-y-0.5 transition-all"
          >
            Оформить заявку
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>

          {note && (
            <p className="mt-4 text-[11px] text-white/45 leading-relaxed">
              <Check size={12} className="inline -mt-0.5 mr-1 text-[#7fd4bc]" />
              {note}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ──────────────── Страница ────────────────
export default function CalculatePage() {
  const [tab, setTab] = useState<Tab>('mount')

  return (
    <div className="relative">
      {/* Заголовок */}
      <section className="relative pt-10 lg:pt-16 pb-6">
        <div className="max-w-[1440px] mx-auto px-5 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center text-center"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] backdrop-blur-xl border border-white/10 text-[11px] font-semibold tracking-[0.14em] uppercase text-white/70">
              Онлайн-расчёт
            </span>
            <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-white">
              Калькуляторы
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Табы */}
      <section className="relative pb-6">
        <div className="max-w-[1440px] mx-auto px-5 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {TABS.map(t => {
              const Icon = t.icon
              const activeTab = tab === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`group relative text-left p-4 lg:p-5 rounded-2xl border transition-all duration-300 ${
                    activeTab
                      ? 'bg-gradient-to-br from-[#0F1C55] to-[#1E40AF] border-[#60A5FA]/50 shadow-[0_14px_40px_-12px_rgba(37,99,235,0.65)]'
                      : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      activeTab
                        ? 'bg-gradient-to-br from-[#14c296] to-[#3ce0b4] shadow-[0_8px_22px_-6px_rgba(20,194,150,0.7)]'
                        : 'bg-white/[0.06] border border-white/15'
                    }`}>
                      <Icon size={18} className={activeTab ? 'text-white' : 'text-[#7fd4bc]'} strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-white font-bold text-[15px] leading-tight">{t.title}</div>
                      <div className="text-white/55 text-[12px] mt-1">{t.sub}</div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Активный калькулятор */}
      <section className="relative pb-20">
        <div className="max-w-[1440px] mx-auto px-5 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {tab === 'mount'   && <MountCalc />}
              {tab === 'archive' && <ArchiveCalc />}
              {tab === 'ups'     && <UpsCalc />}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </div>
  )
}
