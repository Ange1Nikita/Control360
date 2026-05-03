'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { FileText, Trash2, Loader2, ArrowLeft, Check } from 'lucide-react'
import { useQuoteStore, removeFromQuote, updateQuantity, clearQuote } from '@/lib/quote-store'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'

export default function NewQuotePage() {
  const router = useRouter()
  const { items, total, count } = useQuoteStore()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ clientName: '', clientCompany: '', clientPhone: '', clientEmail: '', notes: '' })

  // Pre-fill from profile
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => {
      if (d) setForm(f => ({ ...f, clientName: d.name || '', clientCompany: d.company || '', clientPhone: d.phone || '', clientEmail: d.email || '' }))
    }).catch(() => {})
  }, [])

  const handleSubmit = async () => {
    if (items.length === 0) return
    setSaving(true)
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
          ...form,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        clearQuote()
        router.push(`/dashboard/quotes/${data.id}`)
      } else {
        const err = await res.json()
        alert(err.error || 'Ошибка создания КП')
      }
    } catch { alert('Ошибка соединения') }
    setSaving(false)
  }

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <FileText size={48} className="mx-auto text-neutral-200 mb-4" />
        <h1 className="text-xl font-bold">КП пустое</h1>
        <p className="text-sm text-neutral-400 mt-1">Добавьте товары из каталога</p>
        <Link href="/catalog" className="inline-block mt-4 px-5 py-2.5 bg-[#377efa] text-white font-semibold text-sm rounded-xl">Перейти в каталог</Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 hover:bg-neutral-100 rounded-lg"><ArrowLeft size={20} /></button>
        <div>
          <h1 className="text-2xl font-bold">Оформление КП</h1>
          <p className="text-sm text-neutral-500">{count} позиций</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500">Товар</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-500 w-24">Кол-во</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-500 w-28">Сумма</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {items.map(item => (
                  <tr key={item.productId} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-neutral-400">{item.sku}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center border border-neutral-200 rounded text-neutral-500 hover:border-blue-400">−</button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center border border-neutral-200 rounded text-neutral-500 hover:border-blue-400">+</button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{item.price > 0 ? formatPrice(item.price * item.quantity) : '—'}</td>
                    <td className="px-2 py-3">
                      <button onClick={() => removeFromQuote(item.productId)} className="p-1 text-neutral-300 hover:text-red-500"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Form + Submit */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-3">
            <h3 className="font-semibold text-sm">Данные клиента</h3>
            {[
              { key: 'clientName', label: 'ФИО', placeholder: 'Иванов Иван' },
              { key: 'clientCompany', label: 'Компания', placeholder: 'ООО "Безопасность"' },
              { key: 'clientPhone', label: 'Телефон', placeholder: '+7 (999) 123-45-67' },
              { key: 'clientEmail', label: 'Email', placeholder: 'client@example.com' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-neutral-600 mb-1">{f.label}</label>
                <input value={(form as any)[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">Примечание</label>
              <textarea value={form.notes} onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))} rows={2}
                placeholder="Дополнительная информация..."
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-y" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 p-5">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-neutral-500">Позиций</span>
              <span className="font-medium">{count}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-neutral-100 pt-3 mt-3">
              <span>Итого</span>
              <span>{total > 0 ? formatPrice(total) : 'По запросу'}</span>
            </div>

            <button onClick={handleSubmit} disabled={saving}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#377efa] to-[#5b8cff] text-white font-semibold text-sm rounded-xl
                shadow-[0_2px_12px_rgba(55,126,250,0.3)] hover:shadow-[0_4px_20px_rgba(55,126,250,0.4)] disabled:opacity-50 transition-all">
              {saving ? <><Loader2 size={16} className="animate-spin" /> Создание...</> : <><Check size={16} /> Создать КП</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
