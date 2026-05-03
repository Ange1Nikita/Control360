'use client'

import ParticleField from '@/components/ui/ParticleField'

/**
 * Глобальный фон сайта — тёмно-зелёный градиент с радиальными свечениями,
 * сеткой и глобальными частицами, которые реагируют на курсор.
 * Размещается один раз в `layout.tsx`, общий для всех страниц.
 */
export default function SiteBackground() {
  return (
    <>
      {/* Фиксированные свечения — прилипают к viewport */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#0a6b5e_0%,_#053d37_55%,_#021f1c_100%)]" />
        <div className="absolute top-[10%] -left-40 w-[560px] h-[560px] rounded-full bg-[#009B76] opacity-25 blur-[140px]" />
        <div className="absolute top-[40%] -right-40 w-[640px] h-[640px] rounded-full bg-[#14c296] opacity-20 blur-[160px]" />
        <div className="absolute bottom-[5%] left-1/3 w-[520px] h-[520px] rounded-full bg-[#7fd4bc] opacity-[0.06] blur-[160px]" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(127,212,188,1) 1px, transparent 1px), linear-gradient(90deg, rgba(127,212,188,1) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
      </div>

      {/* Частицы — скроллятся вместе со страницей */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-[1]">
        <ParticleField density={0.00005} maxDistance={160} pointerTarget="window" />
      </div>
    </>
  )
}
