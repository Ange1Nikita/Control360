'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FolderTree, Plus, Pencil, Trash2, Check, X, ChevronRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } }

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newParentId, setNewParentId] = useState('')
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/categories')
    const data = await res.json()
    setCategories(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const addCategory = async () => {
    if (!newName.trim()) return
    setAdding(true)
    await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, parentId: newParentId || null }),
    })
    setNewName('')
    setNewParentId('')
    setAdding(false)
    load()
  }

  const updateCategory = async (id: string) => {
    if (!editName.trim()) return
    await fetch(`/api/admin/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName }),
    })
    setEditId(null)
    load()
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    await fetch(`/api/admin/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    })
    load()
  }

  const deleteCategory = async (id: string) => {
    if (!confirm('Удалить категорию?')) return
    const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      alert(data.error || 'Ошибка удаления')
      return
    }
    load()
  }

  // Flatten categories for parent select
  const allCategories = categories.flatMap(c => [c, ...(c.children || [])])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div {...fadeUp}>
        <h1 className="text-2xl font-bold">Категории</h1>
        <p className="text-sm text-neutral-500 mt-1">Управление деревом категорий</p>
      </motion.div>

      {/* Add form */}
      <div className="mt-6 bg-white rounded-xl border border-neutral-200 p-4">
        <h3 className="text-sm font-semibold mb-3">Добавить категорию</h3>
        <div className="flex gap-2">
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Название категории"
            className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            onKeyDown={e => e.key === 'Enter' && addCategory()} />
          <select value={newParentId} onChange={e => setNewParentId(e.target.value)}
            className="px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
            <option value="">Корневая</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button onClick={addCategory} disabled={adding || !newName.trim()}
            className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
            <Plus size={16} /> Добавить
          </button>
        </div>
      </div>

      {/* Categories list */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={28} /></div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 text-neutral-400">
          <FolderTree size={40} className="mx-auto mb-3" />
          <p>Категорий пока нет</p>
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {categories.map(cat => (
            <div key={cat.id}>
              <CategoryRow
                cat={cat}
                editId={editId} editName={editName}
                onEdit={(id, name) => { setEditId(id); setEditName(name) }}
                onSave={updateCategory}
                onCancel={() => setEditId(null)}
                onEditNameChange={setEditName}
                onToggle={toggleActive}
                onDelete={deleteCategory}
                depth={0}
              />
              {cat.children?.map((child: any) => (
                <CategoryRow key={child.id}
                  cat={child}
                  editId={editId} editName={editName}
                  onEdit={(id, name) => { setEditId(id); setEditName(name) }}
                  onSave={updateCategory}
                  onCancel={() => setEditId(null)}
                  onEditNameChange={setEditName}
                  onToggle={toggleActive}
                  onDelete={deleteCategory}
                  depth={1}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CategoryRow({ cat, editId, editName, onEdit, onSave, onCancel, onEditNameChange, onToggle, onDelete, depth }: {
  cat: any; editId: string | null; editName: string; depth: number
  onEdit: (id: string, name: string) => void; onSave: (id: string) => void; onCancel: () => void
  onEditNameChange: (v: string) => void; onToggle: (id: string, isActive: boolean) => void; onDelete: (id: string) => void
}) {
  const isEditing = editId === cat.id

  return (
    <div className={cn('flex items-center gap-3 p-3 bg-white rounded-lg border border-neutral-200 hover:border-neutral-300 transition-colors', depth > 0 && 'ml-8')}>
      {depth > 0 && <ChevronRight size={14} className="text-neutral-300" />}
      <FolderTree size={16} className={cat.isActive ? 'text-blue-600' : 'text-neutral-300'} />

      {isEditing ? (
        <input value={editName} onChange={e => onEditNameChange(e.target.value)} autoFocus
          className="flex-1 px-2 py-1 border border-blue-300 rounded text-sm focus:outline-none"
          onKeyDown={e => { if (e.key === 'Enter') onSave(cat.id); if (e.key === 'Escape') onCancel() }} />
      ) : (
        <span className={cn('flex-1 text-sm font-medium', !cat.isActive && 'text-neutral-400 line-through')}>{cat.name}</span>
      )}

      <span className="text-xs text-neutral-400">{cat._count?.products || 0} товаров</span>

      <div className="flex gap-1">
        {isEditing ? (
          <>
            <button onClick={() => onSave(cat.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"><Check size={14} /></button>
            <button onClick={onCancel} className="p-1.5 text-neutral-400 hover:bg-neutral-100 rounded transition-colors"><X size={14} /></button>
          </>
        ) : (
          <>
            <button onClick={() => onToggle(cat.id, cat.isActive)}
              className={cn('px-2 py-1 text-xs rounded transition-colors', cat.isActive ? 'text-green-600 bg-green-50' : 'text-neutral-400 bg-neutral-50')}>
              {cat.isActive ? 'Вкл' : 'Выкл'}
            </button>
            <button onClick={() => onEdit(cat.id, cat.name)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"><Pencil size={14} /></button>
            <button onClick={() => onDelete(cat.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"><Trash2 size={14} /></button>
          </>
        )}
      </div>
    </div>
  )
}
