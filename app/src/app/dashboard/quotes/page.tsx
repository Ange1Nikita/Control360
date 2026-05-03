'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FileText, Clock, ArrowRight, Plus } from 'lucide-react'
import { formatPrice, cn } from '@/lib/utils'

const statusConfig: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Черновик', color: 'bg-neutral-100 text-neutral-600' },
  SENT: { label: 'Отправлено', color: 'bg-blue-100 text-blue-700' },
  APPROVED: { label: 'Одобрено', color: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'Отклонено', color: 'bg-red-100 text-red-700' },
  EXPIRED: { label: 'Истекло', color: 'bg-orange-100 text-orange-700' },
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/quotes').then(r => r.ok ? r.json() : []).then(d => {
      setQuotes(Array.isArray(d) ? d : d.items || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Мои КП</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{quotes.length} предложений</p>
        </div>
        <Link href="/catalog"
          className="flex items-center gap-2 px-4 py-2 bg-[#377efa] text-white text-sm font-semibold rounded-xl hover:bg-[#2b6be6] transition-colors">
          <Plus size={16} /> Новое КП
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />)}</div>
      ) : quotes.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
          <FileText size={48} className="mx-auto text-neutral-200 mb-4" />
          <h3 className="font-bold text-neutral-700 text-lg">Нет коммерческих предложений</h3>
          <p className="text-sm text-neutral-400 mt-1">Добавьте товары из каталога и создайте КП</p>
          <Link href="/catalog" className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-[#377efa] text-white text-sm font-semibold rounded-xl">
            Перейти в каталог <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {quotes.map((q: any) => {
            const st = statusConfig[q.status] || statusConfig.DRAFT
            return (
              <motion.div key={q.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Link href={`/dashboard/quotes/${q.id}`}
                  className="flex items-center justify-between p-4 bg-white rounded-xl border border-neutral-200 hover:border-blue-200 hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <FileText size={18} className="text-[#377efa]" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{q.number || 'КП'}</div>
                      <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                        <Clock size={10} />
                        {new Date(q.createdAt).toLocaleDateString('ru-RU')}
                        <span>· {q.items?.length || 0} поз.</span>
                        {q.clientCompany && <span>· {q.clientCompany}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold">{q.total > 0 ? formatPrice(q.total) : 'По запросу'}</span>
                    <span className={cn('px-2.5 py-0.5 text-xs font-medium rounded-full', st.color)}>{st.label}</span>
                    <ArrowRight size={14} className="text-neutral-300" />
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
