'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Save, ArrowLeft, Plus, X, Loader2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } }

interface Attribute { name: string; value: string }
interface ImageItem { url: string; alt: string; isMain: boolean }
interface Prices { rrp: string; priceRetail: string; priceDealer: string; priceCash: string; pricePartner: string; priceVip: string }

export default function ProductEditPage() {
  const params = useParams()
  const router = useRouter()
  const isNew = params.id === 'new'

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])

  // Form state
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [model, setModel] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [brandId, setBrandId] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isNewProduct, setIsNewProduct] = useState(false)
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [images, setImages] = useState<ImageItem[]>([])
  const [prices, setPrices] = useState<Prices>({ rrp: '', priceRetail: '', priceDealer: '', priceCash: '', pricePartner: '', priceVip: '' })
  const [passport, setPassport] = useState('')
  const [stockQty, setStockQty] = useState('')

  // Load categories and brands
  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(d => setCategories(Array.isArray(d) ? d : [])).catch(() => {})
    fetch('/api/brands').then(r => r.json()).then(d => setBrands(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  // Load product data
  useEffect(() => {
    if (isNew) return
    fetch(`/api/admin/products/${params.id}`)
      .then(r => r.json())
      .then(p => {
        setName(p.name || '')
        setSku(p.sku || '')
        setModel(p.model || '')
        setDescription(p.description || '')
        setCategoryId(p.categoryId || '')
        setBrandId(p.brandId || '')
        setIsActive(p.isActive ?? true)
        setIsNewProduct(p.isNew ?? false)
        setPassport(p.passport || '')
        setMetaTitle(p.metaTitle || '')
        setMetaDescription(p.metaDescription || '')
        setAttributes(p.attributes?.map((a: any) => ({ name: a.name, value: a.value })) || [])
        setImages(p.images?.map((i: any) => ({ url: i.url, alt: i.alt || '', isMain: i.isMain })) || [])
        setPrices({
          rrp: p.prices?.rrp?.toString() || '',
          priceRetail: p.prices?.priceRetail?.toString() || '',
          priceDealer: p.prices?.priceDealer?.toString() || '',
          priceCash: p.prices?.priceCash?.toString() || '',
          pricePartner: p.prices?.pricePartner?.toString() || '',
          priceVip: p.prices?.priceVip?.toString() || '',
        })
        setStockQty(p.stock?.[0]?.quantity?.toString() || '')
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [isNew, params.id])

  const save = async () => {
    if (!name.trim()) return alert('Введите название товара')
    setSaving(true)

    const body: any = {
      name, sku, model, description, passport: passport || null, categoryId: categoryId || null, brandId: brandId || null,
      isActive, isNew: isNewProduct, metaTitle, metaDescription, attributes, images,
      prices: {
        rrp: prices.rrp ? parseFloat(prices.rrp) : null,
        priceRetail: prices.priceRetail ? parseFloat(prices.priceRetail) : null,
        priceDealer: prices.priceDealer ? parseFloat(prices.priceDealer) : null,
        priceCash: prices.priceCash ? parseFloat(prices.priceCash) : null,
        pricePartner: prices.pricePartner ? parseFloat(prices.pricePartner) : null,
        priceVip: prices.priceVip ? parseFloat(prices.priceVip) : null,
      },
      stockQty: stockQty ? parseInt(stockQty) : null,
    }

    const url = isNew ? '/api/admin/products' : `/api/admin/products/${params.id}`
    const method = isNew ? 'POST' : 'PUT'

    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) {
      router.push('/admin/products')
    } else {
      const data = await res.json()
      alert(data.error || 'Ошибка сохранения')
    }
    setSaving(false)
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin text-blue-600" size={28} /></div>
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <motion.div {...fadeUp} className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/products')} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{isNew ? 'Новый товар' : 'Редактирование товара'}</h1>
            {!isNew && <p className="text-sm text-neutral-500 mt-0.5">{name}</p>}
          </div>
        </div>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Сохранить
        </button>
      </motion.div>

      <div className="space-y-6">
        {/* Main info */}
        <Section title="Основная информация">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Название *" value={name} onChange={setName} className="md:col-span-2" />
            <Field label="Артикул (SKU)" value={sku} onChange={setSku} />
            <Field label="Модель" value={model} onChange={setModel} />
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-neutral-600 mb-1">Описание</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-y" />
            </div>
          </div>
        </Section>

        {/* Category & Brand */}
        <Section title="Классификация">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">Категория</label>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                <option value="">— Не выбрана —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">Бренд</label>
              <select value={brandId} onChange={e => setBrandId(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                <option value="">— Не выбран —</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="rounded border-neutral-300" />
              <span className="text-sm">Активен (виден в каталоге)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isNewProduct} onChange={e => setIsNewProduct(e.target.checked)} className="rounded border-neutral-300" />
              <span className="text-sm">Новинка</span>
            </label>
          </div>
        </Section>

        {/* Prices */}
        <Section title="Цены">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="РРЦ" value={prices.rrp} onChange={v => setPrices(p => ({ ...p, rrp: v }))} type="number" />
            <Field label="Розница" value={prices.priceRetail} onChange={v => setPrices(p => ({ ...p, priceRetail: v }))} type="number" />
            <Field label="Дилер" value={prices.priceDealer} onChange={v => setPrices(p => ({ ...p, priceDealer: v }))} type="number" />
            <Field label="Нал" value={prices.priceCash} onChange={v => setPrices(p => ({ ...p, priceCash: v }))} type="number" />
            <Field label="Партнёр" value={prices.pricePartner} onChange={v => setPrices(p => ({ ...p, pricePartner: v }))} type="number" />
            <Field label="VIP" value={prices.priceVip} onChange={v => setPrices(p => ({ ...p, priceVip: v }))} type="number" />
          </div>
        </Section>

        {/* Stock */}
        <Section title="Остаток">
          <Field label="Количество на складе" value={stockQty} onChange={setStockQty} type="number" className="max-w-xs" />
        </Section>

        {/* Passport */}
        <Section title="Паспорт товара">
          <Field label="Ссылка на PDF (паспорт)" value={passport} onChange={setPassport} />
        </Section>

        {/* Attributes */}
        <Section title="Характеристики">
          {attributes.map((attr, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input value={attr.name} onChange={e => { const a = [...attributes]; a[i] = { ...a[i], name: e.target.value }; setAttributes(a) }}
                placeholder="Название" className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              <input value={attr.value} onChange={e => { const a = [...attributes]; a[i] = { ...a[i], value: e.target.value }; setAttributes(a) }}
                placeholder="Значение" className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              <button onClick={() => setAttributes(a => a.filter((_, j) => j !== i))}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><X size={16} /></button>
            </div>
          ))}
          <button onClick={() => setAttributes(a => [...a, { name: '', value: '' }])}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mt-2">
            <Plus size={14} /> Добавить характеристику
          </button>
        </Section>

        {/* Images */}
        <Section title="Изображения">
          {images.map((img, i) => (
            <div key={i} className="flex gap-2 mb-2 items-center">
              <input value={img.url} onChange={e => { const a = [...images]; a[i] = { ...a[i], url: e.target.value }; setImages(a) }}
                placeholder="URL изображения" className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              <input value={img.alt} onChange={e => { const a = [...images]; a[i] = { ...a[i], alt: e.target.value }; setImages(a) }}
                placeholder="Alt текст" className="w-40 px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              <label className="flex items-center gap-1 text-xs whitespace-nowrap cursor-pointer">
                <input type="radio" name="mainImage" checked={img.isMain}
                  onChange={() => setImages(imgs => imgs.map((im, j) => ({ ...im, isMain: j === i })))} />
                Главное
              </label>
              <button onClick={() => setImages(a => a.filter((_, j) => j !== i))}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><X size={16} /></button>
            </div>
          ))}
          <button onClick={() => setImages(a => [...a, { url: '', alt: '', isMain: a.length === 0 }])}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mt-2">
            <Plus size={14} /> Добавить изображение
          </button>
        </Section>

        {/* SEO */}
        <Section title="SEO">
          <div className="grid grid-cols-1 gap-4">
            <Field label="Meta Title" value={metaTitle} onChange={setMetaTitle} />
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">Meta Description</label>
              <textarea value={metaDescription} onChange={e => setMetaDescription(e.target.value)} rows={2}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-y" />
            </div>
          </div>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5">
      <h2 className="font-semibold text-sm mb-4">{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', className = '' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; className?: string
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-neutral-600 mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
    </div>
  )
}
