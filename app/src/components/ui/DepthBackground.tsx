'use client'

import { useEffect, useState, ReactNode } from 'react'

export default function DepthBackground({ children }: { children: ReactNode }) {
  const [mouseX, setMouseX] = useState(0.5)
  const [mouseY, setMouseY] = useState(0.5)
  const [smoothX, setSmoothX] = useState(0.5)
  const [smoothY, setSmoothY] = useState(0.5)

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const onMove = (e: MouseEvent) => {
      setMouseX(e.clientX / window.innerWidth)
      setMouseY(e.clientY / window.innerHeight)
    }
    window.addEventListener('mousemove', onMove, { passive: true })

    // Smooth lerp
    let raf: number
    const lerp = () => {
      setSmoothX(prev => prev + (mouseX - prev) * 0.04)
      setSmoothY(prev => prev + (mouseY - prev) * 0.04)
      raf = requestAnimationFrame(lerp)
    }
    raf = requestAnimationFrame(lerp)

    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [mouseX, mouseY])

  // Parallax offsets per layer (deeper = less movement)
  const px = (depth: number) => (smoothX - 0.5) * depth
  const py = (depth: number) => (smoothY - 0.5) * depth

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f4f7fe]">
      {/* Layer 0 — farthest, most pale */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#f4f7fe] via-[#edf2ff] to-[#f4f7fe]" />

        {/* Far blobs — pale, large, slow parallax */}
        <div
          className="absolute w-[700px] h-[700px] rounded-full opacity-30 blur-[180px]"
          style={{
            background: 'radial-gradient(circle, #dce8fc 0%, transparent 70%)',
            top: '5%', left: '10%',
            transform: `translate(${px(8)}px, ${py(8)}px)`,
          }}
        />
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-25 blur-[160px]"
          style={{
            background: 'radial-gradient(circle, #dce8fc 0%, transparent 70%)',
            bottom: '10%', right: '5%',
            transform: `translate(${px(6)}px, ${py(6)}px)`,
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-20 blur-[140px]"
          style={{
            background: 'radial-gradient(circle, #acc9fc 0%, transparent 70%)',
            top: '40%', left: '50%',
            transform: `translate(calc(-50% + ${px(10)}px), calc(-50% + ${py(10)}px))`,
          }}
        />

        {/* Mid blobs — more saturated, medium blur */}
        <div
          className="absolute w-[350px] h-[350px] rounded-full opacity-20 blur-[100px]"
          style={{
            background: 'radial-gradient(circle, #73a6ff 0%, transparent 70%)',
            top: '15%', right: '20%',
            transform: `translate(${px(20)}px, ${py(20)}px)`,
          }}
        />
        <div
          className="absolute w-[300px] h-[300px] rounded-full opacity-15 blur-[90px]"
          style={{
            background: 'radial-gradient(circle, #73a6ff 0%, transparent 70%)',
            bottom: '20%', left: '15%',
            transform: `translate(${px(18)}px, ${py(18)}px)`,
          }}
        />

        {/* Near blobs — most saturated, smallest, most parallax */}
        <div
          className="absolute w-[180px] h-[180px] rounded-full opacity-12 blur-[60px]"
          style={{
            background: 'radial-gradient(circle, #377efa 0%, transparent 70%)',
            top: '25%', left: '30%',
            transform: `translate(${px(35)}px, ${py(35)}px)`,
          }}
        />
        <div
          className="absolute w-[150px] h-[150px] rounded-full opacity-10 blur-[50px]"
          style={{
            background: 'radial-gradient(circle, #377efa 0%, transparent 70%)',
            bottom: '30%', right: '25%',
            transform: `translate(${px(40)}px, ${py(40)}px)`,
          }}
        />
        <div
          className="absolute w-[120px] h-[120px] rounded-full opacity-8 blur-[40px]"
          style={{
            background: 'radial-gradient(circle, #377efa 0%, transparent 65%)',
            top: '60%', right: '40%',
            transform: `translate(${px(45)}px, ${py(45)}px)`,
          }}
        />

        {/* Subtle noise */}
        <div className="absolute inset-0 opacity-[0.018]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Content */}
      <div className="relative">{children}</div>
    </div>
  )
}
