'use client'

import { useEffect, useRef } from 'react'

/*
  Recognizable low-voltage / security equipment silhouettes.
  Each drawn at 48x48 viewBox for clarity.
*/
const ITEMS = [
  // 0 — Dome camera (купольная камера) — half-sphere on ceiling plate
  `<g stroke="currentColor" fill="none" stroke-width="1.4">
    <rect x="8" y="4" width="32" height="4" rx="1"/>
    <path d="M12 8c0 0-2 10 12 14"/>
    <path d="M36 8c0 0 2 10-12 14"/>
    <ellipse cx="24" cy="15" rx="12" ry="8"/>
    <circle cx="24" cy="14" r="5"/>
    <circle cx="24" cy="14" r="2" fill="currentColor" opacity="0.3"/>
  </g>`,

  // 1 — Bullet camera (цилиндрическая камера) — tube with lens
  `<g stroke="currentColor" fill="none" stroke-width="1.4">
    <rect x="4" y="16" width="28" height="16" rx="4"/>
    <circle cx="18" cy="24" r="6"/>
    <circle cx="18" cy="24" r="3"/>
    <circle cx="18" cy="24" r="1" fill="currentColor" opacity="0.4"/>
    <path d="M32 20l10-4v16l-10-4z"/>
    <rect x="2" y="10" width="6" height="8" rx="1"/>
    <path d="M5 10V6"/>
  </g>`,

  // 2 — PTZ camera (поворотная камера) — sphere on arm
  `<g stroke="currentColor" fill="none" stroke-width="1.4">
    <rect x="18" y="2" width="12" height="5" rx="1"/>
    <path d="M24 7v6"/>
    <circle cx="24" cy="20" r="10"/>
    <circle cx="24" cy="20" r="6"/>
    <circle cx="24" cy="20" r="2.5" fill="currentColor" opacity="0.3"/>
    <path d="M14 30l-3 5M34 30l3 5"/>
  </g>`,

  // 3 — RJ45 connector (коннектор RJ45)
  `<g stroke="currentColor" fill="none" stroke-width="1.4">
    <rect x="10" y="8" width="28" height="32" rx="3"/>
    <rect x="14" y="18" width="20" height="10" rx="1.5"/>
    <path d="M16 8V2M20 8V2M24 8V2M28 8V2M32 8V2M36 8V4"/>
    <path d="M18 28v6M22 28v6M26 28v6M30 28v6"/>
    <path d="M10 14h28"/>
    <rect x="12" y="34" width="24" height="4" rx="1"/>
  </g>`,

  // 4 — Network switch (коммутатор) — rectangular box with ports
  `<g stroke="currentColor" fill="none" stroke-width="1.4">
    <rect x="2" y="12" width="44" height="20" rx="3"/>
    <rect x="6" y="17" width="5" height="6" rx="1"/>
    <rect x="13" y="17" width="5" height="6" rx="1"/>
    <rect x="20" y="17" width="5" height="6" rx="1"/>
    <rect x="27" y="17" width="5" height="6" rx="1"/>
    <rect x="34" y="17" width="5" height="6" rx="1"/>
    <circle cx="8" cy="27" r="1.5" fill="currentColor" opacity="0.4"/>
    <circle cx="14" cy="27" r="1.5" fill="currentColor" opacity="0.4"/>
    <circle cx="20" cy="27" r="1.5"/>
    <path d="M6 12V8M14 12V7M22 12V8M30 12V6M38 12V8"/>
  </g>`,

  // 5 — DVR / видеорегистратор — box with screen and HDD slot
  `<g stroke="currentColor" fill="none" stroke-width="1.4">
    <rect x="2" y="10" width="44" height="24" rx="3"/>
    <rect x="5" y="13" width="18" height="12" rx="1.5"/>
    <line x1="8" y1="18" x2="20" y2="18"/>
    <line x1="8" y1="21" x2="16" y2="21"/>
    <circle cx="36" cy="20" r="5"/>
    <circle cx="36" cy="20" r="2"/>
    <rect x="5" y="28" width="6" height="3" rx="0.5"/>
    <rect x="13" y="28" width="6" height="3" rx="0.5"/>
    <circle cx="30" cy="30" r="1" fill="currentColor" opacity="0.5"/>
    <circle cx="34" cy="30" r="1"/>
    <circle cx="38" cy="30" r="1" fill="currentColor" opacity="0.5"/>
  </g>`,

  // 6 — Crimper (кримпер / обжимной инструмент)
  `<g stroke="currentColor" fill="none" stroke-width="1.4">
    <path d="M6 40l8-14"/>
    <path d="M42 40l-8-14"/>
    <path d="M14 26h20"/>
    <path d="M16 26l4-18h8l4 18"/>
    <path d="M18 14h12"/>
    <path d="M20 8h8v4h-8z"/>
    <path d="M6 40c0 2 4 4 8 2"/>
    <path d="M42 40c0 2-4 4-8 2"/>
    <circle cx="10" cy="36" r="1.5"/>
    <circle cx="38" cy="36" r="1.5"/>
  </g>`,

  // 7 — Mounting box (монтажная коробка) — square with cable entries
  `<g stroke="currentColor" fill="none" stroke-width="1.4">
    <rect x="6" y="6" width="36" height="36" rx="4"/>
    <rect x="12" y="12" width="24" height="24" rx="2"/>
    <circle cx="24" cy="24" r="6"/>
    <circle cx="24" cy="24" r="2"/>
    <circle cx="6" cy="14" r="2.5"/>
    <circle cx="6" cy="34" r="2.5"/>
    <circle cx="42" cy="14" r="2.5"/>
    <circle cx="42" cy="34" r="2.5"/>
    <circle cx="14" cy="6" r="2.5"/>
    <circle cx="34" cy="6" r="2.5"/>
    <circle cx="14" cy="42" r="2.5"/>
    <circle cx="34" cy="42" r="2.5"/>
  </g>`,

  // 8 — Mini camera (маленькая камера — кубик)
  `<g stroke="currentColor" fill="none" stroke-width="1.4">
    <rect x="10" y="12" width="20" height="20" rx="3"/>
    <circle cx="20" cy="22" r="6"/>
    <circle cx="20" cy="22" r="3"/>
    <circle cx="20" cy="22" r="1" fill="currentColor" opacity="0.4"/>
    <rect x="32" y="18" width="8" height="8" rx="1"/>
    <path d="M30 22h2"/>
    <circle cx="26" cy="14" r="1.5" fill="currentColor" opacity="0.3"/>
    <rect x="16" y="6" width="8" height="6" rx="1"/>
    <path d="M20 6V2"/>
  </g>`,

  // 9 — Patch panel (патч-панель)
  `<g stroke="currentColor" fill="none" stroke-width="1.4">
    <rect x="2" y="14" width="44" height="16" rx="2"/>
    <rect x="5" y="18" width="4" height="5" rx="0.5"/>
    <rect x="11" y="18" width="4" height="5" rx="0.5"/>
    <rect x="17" y="18" width="4" height="5" rx="0.5"/>
    <rect x="23" y="18" width="4" height="5" rx="0.5"/>
    <rect x="29" y="18" width="4" height="5" rx="0.5"/>
    <rect x="35" y="18" width="4" height="5" rx="0.5"/>
    <path d="M7 26v4M13 26v4M19 26v4M25 26v4M31 26v4M37 26v4"/>
    <circle cx="6" cy="14" r="2"/>
    <circle cx="42" cy="14" r="2"/>
  </g>`,

  // 10 — Cable coil (бухта кабеля)
  `<g stroke="currentColor" fill="none" stroke-width="1.4">
    <ellipse cx="24" cy="24" rx="16" ry="16"/>
    <ellipse cx="24" cy="24" rx="8" ry="8"/>
    <path d="M24 8v-4"/>
    <path d="M8 24H4"/>
    <path d="M24 40v4"/>
    <path d="M40 24h4"/>
    <path d="M12 12L8 8"/>
    <path d="M36 12l4-4"/>
  </g>`,

  // 11 — Power supply (блок питания)
  `<g stroke="currentColor" fill="none" stroke-width="1.4">
    <rect x="6" y="8" width="36" height="28" rx="3"/>
    <path d="M22 18l-4 6h8l-4 6"/>
    <rect x="10" y="36" width="8" height="6" rx="1"/>
    <rect x="30" y="36" width="8" height="6" rx="1"/>
    <circle cx="36" cy="12" r="2" fill="currentColor" opacity="0.3"/>
    <path d="M10 12h8"/>
    <path d="M10 15h6"/>
  </g>`,

  // 12 — Fisheye camera (панорамная камера)
  `<g stroke="currentColor" fill="none" stroke-width="1.4">
    <circle cx="24" cy="24" r="18"/>
    <circle cx="24" cy="24" r="12"/>
    <circle cx="24" cy="24" r="6"/>
    <circle cx="24" cy="24" r="2" fill="currentColor" opacity="0.3"/>
    <path d="M6 24h4M38 24h4M24 6v4M24 38v4"/>
  </g>`,

  // 13 — Smoke detector (датчик дыма)
  `<g stroke="currentColor" fill="none" stroke-width="1.4">
    <rect x="8" y="4" width="32" height="4" rx="1"/>
    <ellipse cx="24" cy="20" rx="16" ry="10"/>
    <circle cx="24" cy="18" r="4"/>
    <circle cx="24" cy="18" r="1.5" fill="currentColor" opacity="0.4"/>
    <path d="M20 28c0 2 2 4 4 4s4-2 4-4"/>
    <path d="M18 10l-2-2M30 10l2-2"/>
  </g>`,

  // 14 — Access controller (контроллер СКУД)
  `<g stroke="currentColor" fill="none" stroke-width="1.4">
    <rect x="8" y="4" width="32" height="40" rx="3"/>
    <rect x="12" y="8" width="24" height="14" rx="1.5"/>
    <circle cx="24" cy="30" r="5"/>
    <circle cx="24" cy="30" r="2" fill="currentColor" opacity="0.4"/>
    <rect x="14" y="38" width="6" height="3" rx="0.5"/>
    <rect x="28" y="38" width="6" height="3" rx="0.5"/>
    <line x1="14" y1="13" x2="34" y2="13"/>
    <line x1="14" y1="17" x2="28" y2="17"/>
  </g>`,
]

interface Item {
  x: number
  y: number
  vy: number
  vx: number
  rotation: number
  rotSpeed: number
  scale: number
  opacity: number
  idx: number
}

export default function FloatingItems() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const count = Math.max(30, Math.floor(window.innerWidth / 50))
    const color = '#8da4bf'
    const iconSize = 64

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = document.documentElement.scrollHeight
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(document.documentElement)

    // Pre-render SVGs
    const images: HTMLImageElement[] = []
    let loaded = 0
    ITEMS.forEach((path, i) => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" viewBox="0 0 48 48" color="${color}">${path}</svg>`
      const img = new Image()
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
      img.onload = () => loaded++
      images[i] = img
    })

    const items: Item[] = Array.from({ length: count }, () => ({
      x: Math.random() * (canvas.width + 100) - 50,
      y: Math.random() * canvas.height,
      vy: 0.1 + Math.random() * 0.2,
      vx: (Math.random() - 0.5) * 0.12,
      rotation: Math.random() * 40 - 20,
      rotSpeed: (Math.random() - 0.5) * 0.12,
      scale: 0.6 + Math.random() * 0.6,
      opacity: 0.08 + Math.random() * 0.1,
      idx: Math.floor(Math.random() * ITEMS.length),
    }))

    let raf = 0
    const draw = () => {
      if (loaded < ITEMS.length) { raf = requestAnimationFrame(draw); return }
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const it of items) {
        it.y -= it.vy
        it.x += it.vx
        it.rotation += it.rotSpeed

        if (it.y < -100) {
          it.y = canvas.height + 100
          it.x = Math.random() * canvas.width
        }
        if (it.x < -100) it.x = canvas.width + 100
        if (it.x > canvas.width + 100) it.x = -100

        ctx.save()
        ctx.translate(it.x, it.y)
        ctx.rotate((it.rotation * Math.PI) / 180)
        ctx.globalAlpha = it.opacity
        const s = iconSize * it.scale
        ctx.drawImage(images[it.idx], -s / 2, -s / 2, s, s)
        ctx.restore()
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 5 }} />
}
