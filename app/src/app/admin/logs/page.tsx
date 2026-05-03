'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Activity, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } }

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/logs?page=${page}&limit=50`)
    const data = await res.json()
    setLogs(data.items || [])
    setTotal(data.total || 0)
    setPages(data.pages || 1)
    setLoading(false)
  }

  useEffect(() => { load() }, [page])

  const formatDate = (d: string) => new Date(d).toLocaleString('ru-RU', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  const actionLabels: Record<string, string> = {
    'user.approve': 'Подтверждение пользователя',
    'user.update': 'Изменение пользователя',
    'product.create': 'Создание товара',
    'product.update': 'Изменение товара',
    'product.delete': 'Удаление товара',
    'category.create': 'Создание категории',
    'category.delete': 'Удаление категории',
    'brand.create': 'Создание бренда',
    'brand.delete': 'Удаление бренда',
    'import.products': 'Импорт товаров',
    'import.prices': 'Импорт прайсов',
    'quote.update': 'Изменение КП',
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <motion.div {...fadeUp}>
        <h1 className="text-2xl font-bold">Журнал действий</h1>
        <p className="text-sm text-neutral-500 mt-1">{total} записей</p>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={28} /></div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 text-neutral-400">
          <Activity size={40} className="mx-auto mb-3" />
          <p>Записей пока нет</p>
        </div>
      ) : (
        <div className="mt-6 bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-neutral-50 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Дата</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Пользователь</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Действие</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Объект</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Детали</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-neutral-500 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                  <td className="px-4 py-3 text-sm">{log.user?.name || log.user?.email || '—'}</td>
                  <td className="px-4 py-3 text-sm font-medium">{actionLabels[log.action] || log.action}</td>
                  <td className="px-4 py-3 text-xs text-neutral-500">{log.entity}</td>
                  <td className="px-4 py-3 text-xs text-neutral-400 max-w-[300px] truncate">{log.details || '—'}</td>
                </tr>
              ))}
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
