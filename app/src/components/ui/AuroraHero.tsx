'use client'

import { useEffect, useRef } from 'react'

export default function AuroraHero({ children }: { children: React.ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    let time = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2)
      canvas.width = canvas.offsetWidth * dpr
      canvas.height = canvas.offsetHeight * dpr
      ctx.scale(dpr, dpr)
    }

    resize()
    window.addEventListener('resize', resize)

    // Check reduced motion preference
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const draw = () => {
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight

      // Clear with near-white
      ctx.fillStyle = '#f8faff'
      ctx.fillRect(0, 0, w, h)

      if (prefersReduced) return

      time += 0.003

      // Draw aurora blobs
      const blobs = [
        { x: w * 0.2, y: h * 0.3, r: w * 0.35, color: '55, 126, 250', phase: 0 },
        { x: w * 0.7, y: h * 0.5, r: w * 0.3, color: '115, 166, 255', phase: 1.5 },
        { x: w * 0.5, y: h * 0.7, r: w * 0.25, color: '172, 201, 252', phase: 3 },
        { x: w * 0.85, y: h * 0.2, r: w * 0.2, color: '55, 126, 250', phase: 4.5 },
        { x: w * 0.1, y: h * 0.8, r: w * 0.22, color: '115, 166, 255', phase: 2 },
      ]

      for (const blob of blobs) {
        const t = time + blob.phase
        const x = blob.x + Math.sin(t * 0.7) * w * 0.08 + Math.cos(t * 0.4) * w * 0.04
        const y = blob.y + Math.cos(t * 0.5) * h * 0.06 + Math.sin(t * 0.3) * h * 0.03
        const r = blob.r + Math.sin(t * 0.6) * w * 0.03

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, r)
        gradient.addColorStop(0, `rgba(${blob.color}, 0.12)`)
        gradient.addColorStop(0.4, `rgba(${blob.color}, 0.06)`)
        gradient.addColorStop(0.7, `rgba(${blob.color}, 0.02)`)
        gradient.addColorStop(1, `rgba(${blob.color}, 0)`)

        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, w, h)
      }

      // Subtle mesh/wave overlay
      ctx.globalAlpha = 0.03
      for (let i = 0; i < 5; i++) {
        const t2 = time * 0.8 + i * 1.2
        ctx.beginPath()
        ctx.moveTo(0, h * 0.5)

        for (let x = 0; x <= w; x += 8) {
          const y = h * 0.4 +
            Math.sin(x * 0.003 + t2) * h * 0.08 +
            Math.cos(x * 0.005 + t2 * 0.7) * h * 0.04 +
            i * h * 0.06
          ctx.lineTo(x, y)
        }

        ctx.lineTo(w, h)
        ctx.lineTo(0, h)
        ctx.closePath()
        ctx.fillStyle = i % 2 === 0 ? '#377efa' : '#73a6ff'
        ctx.fill()
      }
      ctx.globalAlpha = 1

      animationId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div className="relative overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: 'none' }}
      />
      {/* Subtle noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
      }} />
      <div className="relative">{children}</div>
    </div>
  )
}
