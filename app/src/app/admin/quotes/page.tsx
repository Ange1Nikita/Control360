'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } }

const statusConfig: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Черновик', color: 'bg-neutral-100 text-neutral-600' },
  SENT: { label: 'Отправлено', color: 'bg-blue-100 text-blue-700' },
  APPROVED: { label: 'Одобрено', color: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'Отклонено', color: 'bg-red-100 text-red-700' },
  EXPIRED: { label: 'Истекло', color: 'bg-orange-100 text-orange-700' },
}

export default function AdminQuotesPage() {
  const [quotes, setQuotes] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '25' })
    if (filter) params.set('status', filter)
    const res = await fetch(`/api/admin/quotes?${params}`)
    const data = await res.json()
    setQuotes(data.items || [])
    setTotal(data.total || 0)
    setPages(data.pages || 1)
    setLoading(false)
  }

  useEffect(() => { load() }, [page, filter])

  const updateStatus = async (quoteId: string, status: string) => {
    await fetch('/api/admin/quotes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteId, status }),
    })
    load()
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <motion.div {...fadeUp}>
        <h1 className="text-2xl font-bold">Коммерческие предложения</h1>
        <p className="text-sm text-neutral-500 mt-1">{total} КП</p>
      </motion.div>

      {/* Filters */}
      <div className="flex gap-1 mt-6 mb-6">
        {['', 'DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED'].map(f => (
          <button key={f} onClick={() => { setFilter(f); setPage(1) }}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              filter === f ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200')}>
            {f === '' ? 'Все' : statusConfig[f]?.label || f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={28} /></div>
      ) : quotes.length === 0 ? (
        <div className="text-center py-16 text-neutral-400">
          <FileText size={40} className="mx-auto mb-3" />
          <p>КП не найдены</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-neutral-50 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase w-8"></th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Номер</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Клиент</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Позиций</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Сумма</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Дата</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {quotes.map(q => {
                const st = statusConfig[q.status] || statusConfig.DRAFT
                const isExpanded = expanded === q.id
                return (
                  <tr key={q.id} className="group">
                    <td colSpan={7} className="p-0">
                      <div>
                        <div className="flex items-center hover:bg-neutral-50 transition-colors cursor-pointer" onClick={() => setExpanded(isExpanded ? null : q.id)}>
                          <div className="px-4 py-3 w-8">
                            {isExpanded ? <ChevronUp size={14} className="text-neutral-400" /> : <ChevronDown size={14} className="text-neutral-400" />}
                          </div>
                          <div className="px-4 py-3 text-sm font-mono font-medium">{q.number || q.id.slice(0, 8)}</div>
                          <div className="px-4 py-3 text-sm">
                            <div>{q.clientName || q.user?.name || '—'}</div>
                            <div className="text-xs text-neutral-400">{q.clientCompany || q.user?.company || ''}</div>
                          </div>
                          <div className="px-4 py-3 text-sm text-neutral-500">{q.items?.length || 0}</div>
                          <div className="px-4 py-3 text-sm font-medium">{q.total ? formatPrice(q.total) : '—'}</div>
                          <div className="px-4 py-3 text-xs text-neutral-500">{formatDate(q.createdAt)}</div>
                          <div className="px-4 py-3">
                            <select value={q.status} onClick={e => e.stopPropagation()}
                              onChange={e => updateStatus(q.id, e.target.value)}
                              className={cn('px-2 py-1 text-xs font-medium rounded-full border-0 cursor-pointer', st.color)}>
                              {Object.entries(statusConfig).map(([k, v]) => (
                                <option key={k} value={k}>{v.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        {isExpanded && q.items?.length > 0 && (
                          <div className="px-8 pb-4">
                            <table className="w-full text-xs border border-neutral-100 rounded-lg overflow-hidden">
                              <thead className="bg-neutral-50">
                                <tr>
                                  <th className="px-3 py-2 text-left font-semibold">Товар</th>
                                  <th className="px-3 py-2 text-left font-semibold">Артикул</th>
                                  <th className="px-3 py-2 text-right font-semibold">Кол-во</th>
                                  <th className="px-3 py-2 text-right font-semibold">Цена</th>
                                  <th className="px-3 py-2 text-right font-semibold">Сумма</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-neutral-50">
                                {q.items.map((item: any) => (
                                  <tr key={item.id}>
                                    <td className="px-3 py-2">{item.product?.name || '—'}</td>
                                    <td className="px-3 py-2 text-neutral-400">{item.product?.sku || '—'}</td>
                                    <td className="px-3 py-2 text-right">{item.quantity}</td>
                                    <td className="px-3 py-2 text-right">{item.price ? formatPrice(item.price) : '—'}</td>
                                    <td className="px-3 py-2 text-right font-medium">{item.total ? formatPrice(item.total) : '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-100">
              <span className="text-xs text-neutral-400">Страница {page} из {pages}</span>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 rounded hover:bg-neutral-100 disabled:opacity-30"><ChevronLeft size={16} /></button>
                <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                  className="p-1.5 rounded hover:bg-neutral-100 disabled:opacity-30"><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
