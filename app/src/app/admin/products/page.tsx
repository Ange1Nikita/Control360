'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Package, Search, Plus, Pencil, Trash2, Eye, EyeOff, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } }

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '25' })
    if (search) params.set('q', search)
    const res = await fetch(`/api/products?${params}`)
    const data = await res.json()
    setProducts(data.items || [])
    setTotal(data.total || 0)
    setPages(data.pages || 1)
    setLoading(false)
  }, [page, search])

  useEffect(() => { load() }, [load])

  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1) }, 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const toggleActive = async (id: string, isActive: boolean) => {
    await fetch(`/api/admin/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    })
    load()
  }

  const deleteProduct = async (id: string) => {
    if (!confirm('Удалить товар? Это действие нельзя отменить.')) return
    setDeleting(id)
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    setDeleting(null)
    load()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div {...fadeUp} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Товары</h1>
          <p className="text-sm text-neutral-500 mt-1">{total} товаров в каталоге</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/import"
            className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors">
            Импорт
          </Link>
          <Link href="/admin/products/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            <Plus size={16} /> Добавить
          </Link>
        </div>
      </motion.div>

      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
        <input type="text" placeholder="Поиск по названию, артикулу..." value={searchInput} onChange={e => setSearchInput(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={28} /></div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-neutral-400">
          <Package size={40} className="mx-auto mb-3" />
          <p>Товары не найдены</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-50 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Товар</th>
                  <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Артикул</th>
                  <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Бренд</th>
                  <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Категория</th>
                  <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Цена</th>
                  <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Статус</th>
                  <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {products.map((p: any) => {
                  const mainImage = p.images?.find((i: any) => i.isMain) || p.images?.[0]
                  const price = p.prices?.priceRetail || p.prices?.rrp
                  return (
                    <tr key={p.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {mainImage ? (
                            <img src={mainImage.url} alt="" className="w-10 h-10 rounded-lg object-cover border border-neutral-200" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
                              <Package size={16} className="text-neutral-400" />
                            </div>
                          )}
                          <span className="font-medium text-sm truncate max-w-[250px]">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-500 font-mono">{p.sku || '—'}</td>
                      <td className="px-4 py-3 text-sm">{p.brand?.name || '—'}</td>
                      <td className="px-4 py-3 text-sm">{p.category?.name || '—'}</td>
                      <td className="px-4 py-3 text-sm font-medium">{price ? formatPrice(price) : '—'}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleActive(p.id, p.isActive)}
                          className={cn('p-1.5 rounded transition-colors', p.isActive ? 'text-green-600 hover:bg-green-50' : 'text-neutral-400 hover:bg-neutral-100')}
                          title={p.isActive ? 'Активен' : 'Скрыт'}>
                          {p.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Link href={`/admin/products/${p.id}`}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Редактировать">
                            <Pencil size={16} />
                          </Link>
                          <button onClick={() => deleteProduct(p.id)} disabled={deleting === p.id}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50" title="Удалить">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-100">
              <span className="text-xs text-neutral-400">Страница {page} из {pages}</span>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 rounded hover:bg-neutral-100 disabled:opacity-30 transition-colors"><ChevronLeft size={16} /></button>
                <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                  className="p-1.5 rounded hover:bg-neutral-100 disabled:opacity-30 transition-colors"><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
