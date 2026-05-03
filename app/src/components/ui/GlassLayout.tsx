'use client'

import { ReactNode } from 'react'

export default function GlassLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="min-h-[calc(100vh-8rem)] relative">
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-[#dce8fc]">
        {/* Subtle gradient blobs — barely moving */}
        <div className="absolute top-[10%] left-[5%] w-[500px] h-[500px] rounded-full bg-[#acc9fc] opacity-40 blur-[120px] animate-[drift1_30s_ease-in-out_infinite]" />
        <div className="absolute top-[50%] right-[10%] w-[400px] h-[400px] rounded-full bg-[#73a6ff] opacity-20 blur-[140px] animate-[drift2_35s_ease-in-out_infinite]" />
        <div className="absolute bottom-[5%] left-[30%] w-[350px] h-[350px] rounded-full bg-[#dce8fc] opacity-50 blur-[100px] animate-[drift3_25s_ease-in-out_infinite]" />

        {/* Noise texture */}
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }} />
      </div>

      <style jsx>{`
        @keyframes drift1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 15px) scale(0.95); }
        }
        @keyframes drift2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-25px, 20px) scale(1.03); }
          66% { transform: translate(15px, -10px) scale(0.97); }
        }
        @keyframes drift3 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, -15px); }
        }
      `}</style>

      {/* Content */}
      <div className="relative max-w-6xl mx-auto px-5 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-[#0f172a]">{title}</h1>
          {subtitle && <p className="text-sm text-[#475569] mt-1">{subtitle}</p>}
        </div>

        {children}
      </div>
    </div>
  )
}

/* Glass card component */
export function GlassCard({ children, className = '', hover = true }: { children: ReactNode; className?: string; hover?: boolean }) {
  return (
    <div className={`
      bg-white/55 backdrop-blur-xl
      border border-white/70
      rounded-2xl
      shadow-[0_1px_12px_rgba(55,126,250,0.04),0_1px_3px_rgba(0,0,0,0.03)]
      ${hover ? 'hover:bg-white/70 hover:shadow-[0_4px_24px_rgba(55,126,250,0.08),0_1px_3px_rgba(0,0,0,0.04)] hover:translate-y-[-1px] transition-all duration-300' : ''}
      ${className}
    `}>
      {children}
    </div>
  )
}

export function GlassPanel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`
      bg-white/40 backdrop-blur-2xl
      border border-white/60
      rounded-2xl
      shadow-[0_2px_16px_rgba(55,126,250,0.06)]
      ${className}
    `}>
      {children}
    </div>
  )
}
