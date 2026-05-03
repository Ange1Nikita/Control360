'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Save, Loader2, Check } from 'lucide-react'

export default function SettingsPage() {
  const [form, setForm] = useState({ name: '', phone: '', company: '', inn: '' })
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => {
      if (d) {
        setForm({ name: d.name || '', phone: d.phone || '', company: d.company || '', inn: d.inn || '' })
        setEmail(d.email || '')
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000) }
      else { const d = await res.json(); alert(d.error || 'Ошибка') }
    } catch { alert('Ошибка соединения') }
    setSaving(false)
  }

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />)}</div>

  return (
    <div className="max-w-xl space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Настройки профиля</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Обновите свои данные</p>
      </motion.div>

      <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-neutral-600 mb-1">Email</label>
          <input value={email} disabled className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-500" />
        </div>

        {[
          { key: 'name', label: 'ФИО', placeholder: 'Иванов Иван Иванович' },
          { key: 'phone', label: 'Телефон', placeholder: '+7 (999) 123-45-67' },
          { key: 'company', label: 'Компания', placeholder: 'ООО "Безопасность"' },
          { key: 'inn', label: 'ИНН', placeholder: '1234567890' },
        ].map(f => (
          <div key={f.key}>
            <label className="block text-xs font-medium text-neutral-600 mb-1">{f.label}</label>
            <input value={(form as any)[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
          </div>
        ))}

        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#377efa] text-white text-sm font-semibold rounded-xl hover:bg-[#2b6be6] disabled:opacity-50 transition-colors">
          {saving ? <><Loader2 size={16} className="animate-spin" /> Сохранение...</>
            : saved ? <><Check size={16} /> Сохранено</>
            : <><Save size={16} /> Сохранить</>}
        </button>
      </div>
    </div>
  )
}
