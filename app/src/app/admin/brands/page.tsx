'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Tags, Plus, Pencil, Trash2, Check, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } }

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/brands')
    const data = await res.json()
    setBrands(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const addBrand = async () => {
    if (!newName.trim()) return
    setAdding(true)
    await fetch('/api/admin/brands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    })
    setNewName('')
    setAdding(false)
    load()
  }

  const updateBrand = async (id: string) => {
    if (!editName.trim()) return
    await fetch(`/api/admin/brands/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName }),
    })
    setEditId(null)
    load()
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    await fetch(`/api/admin/brands/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    })
    load()
  }

  const deleteBrand = async (id: string) => {
    if (!confirm('Удалить бренд?')) return
    const res = await fetch(`/api/admin/brands/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      alert(data.error || 'Ошибка удаления')
      return
    }
    load()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div {...fadeUp}>
        <h1 className="text-2xl font-bold">Бренды</h1>
        <p className="text-sm text-neutral-500 mt-1">Управление брендами</p>
      </motion.div>

      {/* Add form */}
      <div className="mt-6 bg-white rounded-xl border border-neutral-200 p-4">
        <div className="flex gap-2">
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Название бренда"
            className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            onKeyDown={e => e.key === 'Enter' && addBrand()} />
          <button onClick={addBrand} disabled={adding || !newName.trim()}
            className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
            <Plus size={16} /> Добавить
          </button>
        </div>
      </div>

      {/* Brands list */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={28} /></div>
      ) : brands.length === 0 ? (
        <div className="text-center py-16 text-neutral-400">
          <Tags size={40} className="mx-auto mb-3" />
          <p>Брендов пока нет</p>
        </div>
      ) : (
        <div className="mt-6 bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-neutral-50 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Бренд</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Товаров</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Статус</th>
                <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {brands.map(b => (
                <tr key={b.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-4 py-3">
                    {editId === b.id ? (
                      <input value={editName} onChange={e => setEditName(e.target.value)} autoFocus
                        className="px-2 py-1 border border-blue-300 rounded text-sm focus:outline-none"
                        onKeyDown={e => { if (e.key === 'Enter') updateBrand(b.id); if (e.key === 'Escape') setEditId(null) }} />
                    ) : (
                      <span className={cn('text-sm font-medium', !b.isActive && 'text-neutral-400')}>{b.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-500">{b._count?.products || 0}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(b.id, b.isActive)}
                      className={cn('px-2 py-1 text-xs rounded font-medium transition-colors',
                        b.isActive ? 'text-green-600 bg-green-50' : 'text-neutral-400 bg-neutral-50')}>
                      {b.isActive ? 'Активен' : 'Скрыт'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {editId === b.id ? (
                        <>
                          <button onClick={() => updateBrand(b.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded"><Check size={14} /></button>
                          <button onClick={() => setEditId(null)} className="p-1.5 text-neutral-400 hover:bg-neutral-100 rounded"><X size={14} /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditId(b.id); setEditName(b.name) }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Pencil size={14} /></button>
                          <button onClick={() => deleteBrand(b.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
