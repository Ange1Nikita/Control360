'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FileText, Heart, Package, ArrowRight, Clock } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

const fade = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } }

const statusColors: Record<string, string> = {
  DRAFT: 'bg-neutral-100 text-neutral-600',
  SENT: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
}
const statusLabels: Record<string, string> = {
  DRAFT: 'Черновик', SENT: 'Отправлено', APPROVED: 'Одобрено', REJECTED: 'Отклонено', EXPIRED: 'Истекло',
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [quotes, setQuotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.ok ? r.json() : null),
      fetch('/api/quotes').then(r => r.ok ? r.json() : { items: [] }),
    ]).then(([u, q]) => {
      setUser(u)
      setQuotes(Array.isArray(q) ? q.slice(0, 5) : (q.items || []).slice(0, 5))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />)}</div>
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <motion.div {...fade}>
        <h1 className="text-2xl font-bold">Добро пожаловать{user?.name ? `, ${user.name}` : ''}!</h1>
        {user?.company && <p className="text-sm text-neutral-500 mt-0.5">{user.company}</p>}
      </motion.div>

      {/* Stats */}
      <motion.div {...fade} transition={{ delay: 0.1 }} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: FileText, label: 'КП создано', value: user?.quotesCount || quotes.length || 0, color: '#377efa', href: '/dashboard/quotes' },
          { icon: Heart, label: 'В избранном', value: user?.favoritesCount || 0, color: '#e84393', href: '/dashboard/favorites' },
          { icon: Package, label: 'Товаров в каталоге', value: '1 790', color: '#377efa', href: '/catalog' },
        ].map(s => (
          <Link key={s.label} href={s.href}
            className="flex items-center gap-4 p-5 bg-white rounded-xl border border-neutral-200 hover:border-blue-200 hover:shadow-md transition-all">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${s.color}12` }}>
              <s.icon size={20} style={{ color: s.color }} />
            </div>
            <div>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-neutral-500">{s.label}</div>
            </div>
          </Link>
        ))}
      </motion.div>

      {/* Recent quotes */}
      <motion.div {...fade} transition={{ delay: 0.2 }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Последние КП</h2>
          <Link href="/dashboard/quotes" className="text-xs text-[#377efa] hover:underline">Все КП →</Link>
        </div>

        {quotes.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center">
            <FileText size={36} className="mx-auto text-neutral-200 mb-3" />
            <p className="font-medium text-neutral-700">Нет коммерческих предложений</p>
            <p className="text-sm text-neutral-400 mt-1">Добавьте товары в КП из каталога</p>
            <Link href="/catalog"
              className="inline-flex items-center gap-2 mt-4 px-5 py-2 bg-[#377efa] text-white text-sm font-semibold rounded-xl hover:bg-[#2b6be6] transition-colors">
              Перейти в каталог <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            {quotes.map((q: any, i: number) => (
              <Link key={q.id} href={`/dashboard/quotes/${q.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-0">
                <div className="flex items-center gap-3">
                  <FileText size={16} className="text-[#377efa]" />
                  <div>
                    <span className="text-sm font-medium">{q.number || `КП #${i + 1}`}</span>
                    <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                      <Clock size={10} />
                      {new Date(q.createdAt).toLocaleDateString('ru-RU')}
                      <span>{q.items?.length || 0} поз.</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold">{q.total > 0 ? formatPrice(q.total) : '—'}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${statusColors[q.status] || 'bg-neutral-100 text-neutral-500'}`}>
                    {statusLabels[q.status] || q.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </motion.div>

      {/* Quick action */}
      <motion.div {...fade} transition={{ delay: 0.3 }}>
        <div className="bg-gradient-to-r from-[#377efa] to-[#5b8cff] rounded-xl p-6 text-white">
          <h3 className="font-bold text-lg">Создать коммерческое предложение</h3>
          <p className="text-sm text-blue-100 mt-1">Выберите товары и сформируйте КП в 2 клика</p>
          <Link href="/catalog"
            className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-white text-[#377efa] font-semibold text-sm rounded-xl hover:bg-blue-50 transition-colors">
            Перейти в каталог <ArrowRight size={14} />
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
