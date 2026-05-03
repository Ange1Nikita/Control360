'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Users, Package, Upload, FileText, FolderTree, Tags,
  AlertCircle, Activity, UserCheck, UserX, Clock,
  ShoppingCart, BarChart3, CheckCircle, XCircle, Loader2
} from 'lucide-react'

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } }

interface Stats {
  pendingRegistrations: number
  totalUsers: number
  activeUsers: number
  totalProducts: number
  activeProducts: number
  totalCategories: number
  totalBrands: number
  totalQuotes: number
  recentRegistrations: Array<{
    id: string; name: string; email: string; company: string | null; phone: string | null; inn: string | null; createdAt: string
  }>
  recentImports: Array<{
    id: string; type: string; status: string; filename: string | null; totalRows: number; imported: number; updated: number; errors: number; createdAt: string
  }>
  recentLogs: Array<{
    id: string; action: string; entity: string; entityId: string | null; details: string | null; createdAt: string; user: { name: string; email: string } | null
  }>
}

const navSections = [
  { icon: Users, title: 'Пользователи', desc: 'Управление и подтверждение', href: '/admin/users' },
  { icon: Package, title: 'Товары', desc: 'Каталог и карточки', href: '/admin/products' },
  { icon: FolderTree, title: 'Категории', desc: 'Дерево категорий', href: '/admin/categories' },
  { icon: Tags, title: 'Бренды', desc: 'Управление брендами', href: '/admin/brands' },
  { icon: Upload, title: 'Импорт', desc: 'XML, прайсы, фото', href: '/admin/import' },
  { icon: AlertCircle, title: 'Несопоставленные', desc: 'Товары без матчинга', href: '/admin/unmatched' },
  { icon: FileText, title: 'КП', desc: 'Коммерческие предложения', href: '/admin/quotes' },
  { icon: Activity, title: 'Логи', desc: 'Журнал действий', href: '/admin/logs' },
]

const importTypeLabels: Record<string, string> = {
  PRODUCTS_XML: 'Товары (XML)',
  PRICES: 'Прайсы',
  IMAGES: 'Фото',
}

const importStatusColors: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  PROCESSING: 'bg-yellow-100 text-yellow-700',
  PENDING: 'bg-neutral-100 text-neutral-600',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleRegistration(userId: string, status: 'ACTIVE' | 'BLOCKED') {
    setProcessingIds(prev => new Set(prev).add(userId))
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status }),
      })
      setStats(prev => prev ? {
        ...prev,
        pendingRegistrations: prev.pendingRegistrations - 1,
        activeUsers: status === 'ACTIVE' ? prev.activeUsers + 1 : prev.activeUsers,
        recentRegistrations: prev.recentRegistrations.filter(r => r.id !== userId),
      } : prev)
    } catch (e) {
      console.error(e)
    } finally {
      setProcessingIds(prev => { const s = new Set(prev); s.delete(userId); return s })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <p className="text-red-600">Ошибка загрузки данных</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <motion.div {...fadeUp}>
        <h1 className="text-2xl font-bold">Панель администратора</h1>
        <p className="text-sm text-neutral-500 mt-1">Обзор платформы</p>
      </motion.div>

      {/* Stat Cards */}
      <motion.div
        initial="initial" animate="animate"
        variants={{ animate: { transition: { staggerChildren: 0.04 } } }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          { label: 'Заявки', value: stats.pendingRegistrations, icon: Clock, href: '/admin/users', color: stats.pendingRegistrations > 0 ? 'text-orange-600 bg-orange-50 border-orange-200' : 'text-neutral-500 bg-white' },
          { label: 'Товаров', value: stats.totalProducts, icon: Package, href: '/admin/products', color: 'text-blue-600 bg-white' },
          { label: 'Пользователей', value: stats.activeUsers, icon: Users, href: '/admin/users', color: 'text-green-600 bg-white' },
          { label: 'КП', value: stats.totalQuotes, icon: ShoppingCart, href: '/admin/quotes', color: 'text-purple-600 bg-white' },
        ].map((card) => (
          <motion.div key={card.label} variants={fadeUp}>
            <Link href={card.href}
              className={`block p-5 rounded-xl border border-neutral-200 hover:shadow-md transition-all duration-300 ${card.color}`}>
              <card.icon size={20} className="mb-2" />
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="text-xs mt-1 opacity-70">{card.label}</div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Pending Registrations */}
      {stats.recentRegistrations.length > 0 && (
        <motion.div {...fadeUp} transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-orange-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-orange-100 flex items-center justify-between bg-orange-50">
            <div className="flex items-center gap-2">
              <UserCheck size={18} className="text-orange-600" />
              <h2 className="font-semibold text-sm">Заявки на регистрацию</h2>
              <span className="px-2 py-0.5 bg-orange-200 text-orange-800 text-xs font-bold rounded-full">
                {stats.recentRegistrations.length}
              </span>
            </div>
            <Link href="/admin/users" className="text-xs text-orange-600 hover:underline">Все пользователи →</Link>
          </div>
          <div className="divide-y divide-neutral-100">
            {stats.recentRegistrations.map((reg) => (
              <div key={reg.id} className="px-5 py-3 flex items-center justify-between hover:bg-neutral-50 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{reg.name}</span>
                    <span className="text-xs text-neutral-400">{reg.email}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {reg.company && <span className="text-xs text-neutral-500">{reg.company}</span>}
                    {reg.inn && <span className="text-xs text-neutral-400">ИНН: {reg.inn}</span>}
                    {reg.phone && <span className="text-xs text-neutral-400">{reg.phone}</span>}
                    <span className="text-xs text-neutral-300">{formatDate(reg.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <button
                    onClick={() => handleRegistration(reg.id, 'ACTIVE')}
                    disabled={processingIds.has(reg.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle size={14} />
                    Принять
                  </button>
                  <button
                    onClick={() => handleRegistration(reg.id, 'BLOCKED')}
                    disabled={processingIds.has(reg.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white text-red-600 text-xs font-medium rounded-lg border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <XCircle size={14} />
                    Отклонить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Two column: Recent Imports + Recent Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Imports */}
        <motion.div {...fadeUp} transition={{ delay: 0.15 }}
          className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Upload size={18} className="text-blue-600" />
              <h2 className="font-semibold text-sm">Последние импорты</h2>
            </div>
            <Link href="/admin/import" className="text-xs text-blue-600 hover:underline">Импорт →</Link>
          </div>
          {stats.recentImports.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-neutral-400">Импортов пока нет</div>
          ) : (
            <div className="divide-y divide-neutral-50">
              {stats.recentImports.map((imp) => (
                <div key={imp.id} className="px-5 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{importTypeLabels[imp.type] || imp.type}</span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${importStatusColors[imp.status] || ''}`}>
                      {imp.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-neutral-400">
                    {imp.filename && <span>{imp.filename}</span>}
                    <span>+{imp.imported} / обн. {imp.updated} / ош. {imp.errors}</span>
                    <span>{formatDate(imp.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Logs */}
        <motion.div {...fadeUp} transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-blue-600" />
              <h2 className="font-semibold text-sm">Последние действия</h2>
            </div>
            <Link href="/admin/logs" className="text-xs text-blue-600 hover:underline">Все логи →</Link>
          </div>
          {stats.recentLogs.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-neutral-400">Действий пока нет</div>
          ) : (
            <div className="divide-y divide-neutral-50">
              {stats.recentLogs.map((log) => (
                <div key={log.id} className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{log.action}</span>
                    <span className="text-xs text-neutral-400">{log.entity}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-neutral-400">
                    {log.user && <span>{log.user.name || log.user.email}</span>}
                    {log.details && <span className="truncate max-w-[200px]">{log.details}</span>}
                    <span>{formatDate(log.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Navigation Cards */}
      <div>
        <h2 className="text-sm font-semibold text-neutral-500 mb-3">Разделы</h2>
        <motion.div
          initial="initial" animate="animate"
          variants={{ animate: { transition: { staggerChildren: 0.03 } } }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {navSections.map((s) => (
            <motion.div key={s.title} variants={fadeUp}>
              <Link href={s.href}
                className="group block p-4 bg-white rounded-xl border border-neutral-200 hover:border-blue-200 hover:shadow-md transition-all duration-300">
                <s.icon className="text-blue-600 mb-2 group-hover:scale-110 transition-transform" size={20} />
                <h3 className="font-semibold text-sm">{s.title}</h3>
                <p className="text-xs text-neutral-400 mt-0.5">{s.desc}</p>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
