'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FileText, Heart, Settings, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Обзор' },
  { href: '/dashboard/quotes', icon: FileText, label: 'Мои КП' },
  { href: '/dashboard/favorites', icon: Heart, label: 'Избранное' },
  { href: '/dashboard/settings', icon: Settings, label: 'Настройки' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [user, setUser] = useState<{ name: string; email: string; role: string; company: string | null } | null>(null)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.id) setUser({ name: d.name, email: d.email, role: d.role, company: d.company })
    }).catch(() => {})
  }, [])

  const isActive = (href: string) => href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-[#f8faff]">
      {/* Mobile tabs */}
      <div className="lg:hidden border-b border-neutral-200 bg-white px-4 overflow-x-auto">
        <div className="flex gap-1 py-1">
          {navItems.map(item => (
            <Link key={item.href} href={item.href}
              className={cn('flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors',
                isActive(item.href) ? 'bg-blue-50 text-blue-700' : 'text-neutral-500 hover:text-neutral-700')}>
              <item.icon size={14} /> {item.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-24 space-y-4">
            {/* User info */}
            {user && (
              <div className="bg-white rounded-xl border border-neutral-200 p-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#377efa] to-[#5b8cff] flex items-center justify-center text-white font-bold text-sm mb-2">
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="font-semibold text-sm truncate">{user.name}</div>
                <div className="text-xs text-neutral-400 truncate">{user.email}</div>
                {user.company && <div className="text-xs text-neutral-400 truncate mt-0.5">{user.company}</div>}
              </div>
            )}

            {/* Navigation */}
            <nav className="bg-white rounded-xl border border-neutral-200 p-2 space-y-0.5">
              {navItems.map(item => (
                <Link key={item.href} href={item.href}
                  className={cn('flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    isActive(item.href)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900')}>
                  <item.icon size={16} /> {item.label}
                </Link>
              ))}
              <button onClick={logout}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-all w-full">
                <LogOut size={16} /> Выйти
              </button>
            </nav>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  )
}
