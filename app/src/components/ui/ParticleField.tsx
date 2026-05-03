'use client'

import { useEffect, useRef } from 'react'

interface Props {
  density?: number
  color?: string
  lineColor?: string
  maxDistance?: number
  speed?: number
  className?: string
  /** Source of pointer events. "parent" (default) — mousemove over the direct parent; "window" — mousemove anywhere on the page (useful for full-screen fixed overlays). */
  pointerTarget?: 'parent' | 'window'
}

export default function ParticleField({
  density = 0.00009,
  color = 'rgba(127, 212, 188, 0.85)',
  lineColor = 'rgba(127, 212, 188, 0.22)',
  maxDistance = 150,
  speed = 0.25,
  className = '',
  pointerTarget = 'parent',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const parent = canvas.parentElement
    if (!parent) return

    let width = 0
    let height = 0
    let particles: { x: number; y: number; vx: number; vy: number; r: number }[] = []
    const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2)
    const mouse = { x: -9999, y: -9999, active: false }

    const resize = () => {
      const rect = parent.getBoundingClientRect()
      width = rect.width
      height = rect.height
      if (width === 0 || height === 0) return
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const count = Math.max(28, Math.min(500, Math.floor(width * height * density)))
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        r: Math.random() * 1.4 + 0.5,
      }))
    }
    resize()

    const ro = new ResizeObserver(resize)
    ro.observe(parent)

    const onMove = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
      mouse.active = true
    }
    const onLeave = () => {
      mouse.active = false
      mouse.x = -9999
      mouse.y = -9999
    }
    const pointerSource: Window | HTMLElement = pointerTarget === 'window' ? window : parent
    pointerSource.addEventListener('mousemove', onMove as EventListener)
    pointerSource.addEventListener('mouseleave', onLeave as EventListener)

    const tick = () => {
      ctx.clearRect(0, 0, width, height)

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > width) p.vx *= -1
        if (p.y < 0 || p.y > height) p.vy *= -1
      }

      ctx.strokeStyle = lineColor
      ctx.lineWidth = 1
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i]
          const b = particles[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d2 = dx * dx + dy * dy
          if (d2 < maxDistance * maxDistance) {
            const alpha = 1 - Math.sqrt(d2) / maxDistance
            ctx.globalAlpha = alpha * 0.75
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
        if (mouse.active) {
          const a = particles[i]
          const dx = a.x - mouse.x
          const dy = a.y - mouse.y
          const d2 = dx * dx + dy * dy
          const mr = 180
          if (d2 < mr * mr) {
            const alpha = 1 - Math.sqrt(d2) / mr
            ctx.strokeStyle = `rgba(127, 212, 188, ${alpha * 0.55})`
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(mouse.x, mouse.y)
            ctx.stroke()
            ctx.strokeStyle = lineColor
          }
        }
      }
      ctx.globalAlpha = 1

      ctx.fillStyle = color
      for (const p of particles) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
      pointerSource.removeEventListener('mousemove', onMove as EventListener)
      pointerSource.removeEventListener('mouseleave', onLeave as EventListener)
    }
  }, [density, color, lineColor, maxDistance, speed, pointerTarget])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${className}`}
    />
  )
}
