'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { UserCheck, UserX, Clock, Shield, Users, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } }

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Ожидает', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  ACTIVE: { label: 'Активен', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  BLOCKED: { label: 'Заблокирован', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
}

const roleConfig: Record<string, string> = {
  CLIENT: 'Клиент',
  MANAGER: 'Менеджер',
  ADMIN: 'Администратор',
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const params = filter ? `?status=${filter}` : ''
    const res = await fetch(`/api/admin/users${params}`)
    const data = await res.json()
    setUsers(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  const updateUser = async (userId: string, data: Record<string, string>) => {
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...data }),
    })
    load()
  }

  const filtered = search
    ? users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || (u.company || '').toLowerCase().includes(search.toLowerCase()))
    : users

  const pendingCount = users.filter(u => u.status === 'PENDING').length

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <motion.div {...fadeUp} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Пользователи</h1>
          <p className="text-sm text-neutral-500 mt-1">{users.length} всего{pendingCount > 0 && `, ${pendingCount} ожидают подтверждения`}</p>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
          <input type="text" placeholder="Поиск по имени, email, компании..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
        </div>
        <div className="flex gap-1">
          {['', 'PENDING', 'ACTIVE', 'BLOCKED'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                filter === f ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200')}>
              {f === '' ? 'Все' : statusConfig[f]?.label || f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-neutral-50 rounded-lg animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-neutral-400">
          <Users size={40} className="mx-auto mb-3" />
          <p>Пользователи не найдены</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-neutral-50 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Пользователь</th>
                  <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Компания</th>
                  <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Роль</th>
                  <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Статус</th>
                  <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Дата</th>
                  <th className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((u: any) => {
                  const st = statusConfig[u.status] || statusConfig.PENDING
                  return (
                    <tr key={u.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-sm">{u.name}</div>
                        <div className="text-xs text-neutral-400">{u.email}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-600">
                        {u.company || '—'}
                        {u.inn && <span className="text-xs text-neutral-400 ml-1">ИНН: {u.inn}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <select value={u.role} onChange={e => updateUser(u.id, { role: e.target.value })}
                          className="text-xs border border-neutral-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500">
                          <option value="CLIENT">Клиент</option>
                          <option value="MANAGER">Менеджер</option>
                          <option value="ADMIN">Админ</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border', st.bg, st.color)}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-neutral-400">
                        {new Date(u.createdAt).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {u.status === 'PENDING' && (
                            <button onClick={() => updateUser(u.id, { status: 'ACTIVE' })}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors" title="Подтвердить">
                              <UserCheck size={16} />
                            </button>
                          )}
                          {u.status === 'ACTIVE' && (
                            <button onClick={() => updateUser(u.id, { status: 'BLOCKED' })}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors" title="Заблокировать">
                              <UserX size={16} />
                            </button>
                          )}
                          {u.status === 'BLOCKED' && (
                            <button onClick={() => updateUser(u.id, { status: 'ACTIVE' })}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Разблокировать">
                              <Shield size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
