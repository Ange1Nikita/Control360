'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Heart, FileText, Check, Package, Truck, Shield, ChevronLeft, Download } from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'
import { addToQuote } from '@/lib/quote-store'
import AddToQuoteButton from '@/components/quote/AddToQuoteButton'

function SafeImage({ src, alt, ...props }: any) {
  const [error, setError] = useState(false)
  if (error || !src) return <div className="w-full h-full flex items-center justify-center bg-neutral-100"><span className="text-xs text-neutral-400">Нет фото</span></div>
  return <Image src={src} alt={alt || ''} {...props} onError={() => setError(true)} unoptimized />
}

interface ProductDocument {
  id: string; title: string; url: string; type: string
}

interface Product {
  id: string; name: string; slug: string; sku: string | null; model: string | null; description: string | null; passport: string | null
  images: { id: string; url: string; alt: string | null; isMain: boolean }[]
  brand: { name: string; slug: string } | null
  category: { name: string; slug: string } | null
  prices: { rrp: number | null; priceDealer: number | null; priceCash: number | null; priceRetail: number | null } | null
  stock: { warehouse: string; quantity: number }[]
  attributes: { name: string; value: string }[]
  documents: ProductDocument[]
}

interface SimilarProduct {
  id: string; name: string; slug: string; sku: string | null
  images: { url: string }[]
  brand: { name: string } | null
  prices: { priceRetail: number | null; priceDealer: number | null; rrp: number | null } | null
}

export default function ProductPage() {
  const { slug } = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState(0)
  const [similar, setSimilar] = useState<SimilarProduct[]>([])
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/products/${slug}`)
        if (res.ok) {
          const data = await res.json()
          setProduct(data)
          // Load similar products
          if (data.category?.slug) {
            fetch(`/api/products?category=${data.category.slug}&limit=5`)
              .then(r => r.json())
              .then(d => setSimilar((d.items || []).filter((p: any) => p.id !== data.id).slice(0, 4)))
              .catch(() => {})
          }
        }
      } catch {}
      setLoading(false)
    }
    load()
  }, [slug])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="aspect-square bg-neutral-100 rounded-2xl animate-pulse" />
          <div className="space-y-4">
            <div className="h-6 w-32 bg-neutral-100 rounded animate-pulse" />
            <div className="h-8 w-3/4 bg-neutral-100 rounded animate-pulse" />
            <div className="h-12 w-40 bg-neutral-100 rounded animate-pulse mt-6" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">📦</div>
        <h1 className="text-xl font-bold">Товар не найден</h1>
        <Link href="/catalog" className="text-blue-600 text-sm mt-2 inline-block hover:underline">Вернуться в каталог</Link>
      </div>
    )
  }

  const images = product.images.length > 0 ? product.images : [{ id: '0', url: '', alt: product.name, isMain: true }]
  const price = product.prices?.priceRetail || product.prices?.priceDealer || product.prices?.rrp || 0
  const totalStock = product.stock.reduce((sum, s) => sum + s.quantity, 0)
  const inStock = totalStock > 0

  const handleAddToQuote = () => {
    for (let i = 0; i < quantity; i++) {
      addToQuote({
        productId: product.id,
        name: product.name,
        sku: product.sku || '',
        image: product.images[0]?.url || '',
        price,
      })
    }
    if (quantity > 1) {
      // Set correct quantity
      const { updateQuantity } = require('@/lib/quote-store')
      updateQuantity(product.id, quantity)
    }
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-neutral-400 mb-6 flex-wrap">
        <Link href="/" className="hover:text-neutral-700 transition-colors">Главная</Link>
        <ChevronRight size={14} />
        <Link href="/catalog" className="hover:text-neutral-700 transition-colors">Каталог</Link>
        {product.category && (
          <><ChevronRight size={14} /><Link href={`/catalog?category=${product.category.slug}`} className="hover:text-neutral-700 transition-colors">{product.category.name}</Link></>
        )}
        <ChevronRight size={14} />
        <span className="text-neutral-700 font-medium truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Gallery */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          <div className="relative aspect-square bg-neutral-50 rounded-2xl overflow-hidden border border-neutral-100">
            <AnimatePresence mode="wait">
              <motion.div key={activeImage} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                className="absolute inset-0 p-8">
                <SafeImage src={images[activeImage].url} alt={images[activeImage].alt || product.name} fill className="object-contain" sizes="(max-width:1024px) 100vw, 50vw" priority />
              </motion.div>
            </AnimatePresence>
            {images.length > 1 && (
              <>
                <button onClick={() => setActiveImage(i => (i - 1 + images.length) % images.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur rounded-full shadow hover:bg-white transition-all"><ChevronLeft size={18} /></button>
                <button onClick={() => setActiveImage(i => (i + 1) % images.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur rounded-full shadow hover:bg-white transition-all"><ChevronRight size={18} /></button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button key={img.id} onClick={() => setActiveImage(i)}
                  className={cn('relative w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all',
                    i === activeImage ? 'border-blue-500' : 'border-neutral-200 hover:border-neutral-400')}>
                  <SafeImage src={img.url} alt="" fill className="object-contain p-1" sizes="64px" />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Product info */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          {product.brand && (
            <Link href={`/catalog?brand=${product.brand.slug}`} className="inline-block text-sm text-blue-600 font-medium hover:underline mb-2">{product.brand.name}</Link>
          )}
          <h1 className="text-2xl font-bold leading-tight">{product.name}</h1>
          {product.sku && <div className="text-sm text-neutral-400 mt-1">Артикул: {product.sku}</div>}

          <div className={cn('inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-full text-xs font-medium',
            inStock ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-500')}>
            <div className={cn('w-1.5 h-1.5 rounded-full', inStock ? 'bg-green-500' : 'bg-neutral-400')} />
            {inStock ? `В наличии: ${totalStock} шт` : 'Под заказ'}
          </div>

          {/* Price + Add to Quote */}
          <div className="mt-6 p-5 bg-neutral-50 rounded-xl border border-neutral-100">
            {price > 0 ? (
              <div>
                <div className="text-3xl font-bold">{formatPrice(price)}</div>
                {product.prices?.rrp && price < product.prices.rrp && (
                  <div className="text-sm text-neutral-400 line-through mt-0.5">РРЦ: {formatPrice(product.prices.rrp)}</div>
                )}
              </div>
            ) : (
              <div className="text-lg text-neutral-500">Цена по запросу</div>
            )}

            <div className="flex items-center gap-3 mt-4">
              <div className="flex items-center border border-neutral-200 rounded-lg">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-3 py-2.5 text-neutral-500 hover:bg-neutral-100 transition-colors rounded-l-lg">−</button>
                <input type="number" value={quantity} onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-14 text-center py-2.5 text-sm font-medium border-x border-neutral-200 focus:outline-none" />
                <button onClick={() => setQuantity(q => q + 1)} className="px-3 py-2.5 text-neutral-500 hover:bg-neutral-100 transition-colors rounded-r-lg">+</button>
              </div>

              <button onClick={handleAddToQuote}
                className={cn('flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-200',
                  added
                    ? 'bg-green-500 text-white shadow-[0_2px_12px_rgba(34,197,94,0.3)]'
                    : 'bg-gradient-to-r from-[#377efa] to-[#5b8cff] text-white shadow-[0_2px_12px_rgba(55,126,250,0.3)] hover:shadow-[0_4px_20px_rgba(55,126,250,0.4)] hover:translate-y-[-1px]'
                )}>
                {added ? <><Check size={16} /> Добавлено</> : <><FileText size={16} /> В КП</>}
              </button>
            </div>

            <button className="mt-3 flex items-center gap-2 text-sm text-neutral-500 hover:text-red-500 transition-colors">
              <Heart size={16} /> В избранное
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-2 text-sm text-neutral-600"><Package size={16} className="text-blue-600 shrink-0" /> Склад Краснодар</div>
            <div className="flex items-center gap-2 text-sm text-neutral-600"><Truck size={16} className="text-blue-600 shrink-0" /> Доставка по ЮФО</div>
            <div className="flex items-center gap-2 text-sm text-neutral-600"><Shield size={16} className="text-blue-600 shrink-0" /> Гарантия 1 год</div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="mt-12"><Tabs product={product} /></div>

      {/* Similar products */}
      {similar.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4">Похожие товары</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {similar.map(p => {
              const img = p.images?.[0]?.url || ''
              const pr = (p.prices as any)?.priceRetail || (p.prices as any)?.priceDealer || (p.prices as any)?.rrp
              return (
                <Link key={p.id} href={`/product/${p.slug}`}
                  className="group block bg-white rounded-xl border border-neutral-100 overflow-hidden hover:border-blue-200 hover:shadow-lg transition-all">
                  <div className="relative aspect-square bg-neutral-50 p-4">
                    {img ? <SafeImage src={img} alt={p.name} fill className="object-contain group-hover:scale-105 transition-transform" /> :
                      <div className="w-full h-full flex items-center justify-center"><Package size={24} className="text-neutral-200" /></div>}
                  </div>
                  <div className="p-3">
                    {p.brand && <div className="text-xs text-blue-600 font-medium mb-0.5">{p.brand.name}</div>}
                    <h3 className="text-sm font-medium line-clamp-2 min-h-[2.5rem]">{p.name}</h3>
                    <div className="mt-1.5">{pr ? <span className="font-bold">{formatPrice(pr)}</span> : <span className="text-xs text-neutral-400">По запросу</span>}</div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function Tabs({ product }: { product: Product }) {
  type TabType = 'specs' | 'desc' | 'docs'
  const [tab, setTab] = useState<TabType>('specs')
  const hasDocs = (product.documents && product.documents.length > 0) || !!product.passport

  const DOC_ICONS: Record<string, { bg: string; text: string }> = {
    passport: { bg: 'bg-red-100', text: 'text-red-600' },
    certificate: { bg: 'bg-green-100', text: 'text-green-600' },
    instruction: { bg: 'bg-blue-100', text: 'text-blue-600' },
    datasheet: { bg: 'bg-purple-100', text: 'text-purple-600' },
    document: { bg: 'bg-neutral-100', text: 'text-neutral-600' },
  }

  return (
    <div>
      <div className="flex gap-1 border-b border-neutral-200">
        <button onClick={() => setTab('specs')} className={cn('px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
          tab === 'specs' ? 'border-blue-600 text-blue-600' : 'border-transparent text-neutral-500 hover:text-neutral-700')}>
          Характеристики {product.attributes.length > 0 && `(${product.attributes.length})`}
        </button>
        <button onClick={() => setTab('desc')} className={cn('px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
          tab === 'desc' ? 'border-blue-600 text-blue-600' : 'border-transparent text-neutral-500 hover:text-neutral-700')}>
          Описание
        </button>
        {hasDocs && (
          <button onClick={() => setTab('docs')} className={cn('px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
            tab === 'docs' ? 'border-blue-600 text-blue-600' : 'border-transparent text-neutral-500 hover:text-neutral-700')}>
            Документация
          </button>
        )}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="py-6">
          {tab === 'specs' && (
            product.attributes.length > 0 ? (
              <div className="grid gap-0 max-w-2xl">
                {product.attributes.map((attr, i) => (
                  <div key={i} className={cn('flex py-2.5 px-3 text-sm rounded', i % 2 === 0 ? 'bg-neutral-50' : '')}>
                    <span className={attr.name ? 'w-1/2 text-neutral-500' : 'text-neutral-700'}>{attr.name || attr.value}</span>
                    {attr.name && <span className="w-1/2 font-medium">{attr.value}</span>}
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-neutral-400">Характеристики не указаны</p>
          )}
          {tab === 'desc' && (
            product.description
              ? <div className="prose prose-sm max-w-2xl text-neutral-700" dangerouslySetInnerHTML={{ __html: product.description }} />
              : <p className="text-sm text-neutral-400">Описание отсутствует</p>
          )}
          {tab === 'docs' && (
            <div className="max-w-2xl space-y-3">
              {product.documents?.map(doc => {
                const style = DOC_ICONS[doc.type] || DOC_ICONS.document
                return (
                  <a key={doc.id} href={doc.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 px-5 py-3.5 bg-white border border-neutral-200 rounded-xl hover:border-blue-200 hover:bg-blue-50/50 transition-colors">
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', style.bg)}>
                      <FileText size={20} className={style.text} />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-neutral-800">{doc.title}</div>
                      <div className="text-xs text-neutral-400">PDF</div>
                    </div>
                    <Download size={16} className="text-neutral-400" />
                  </a>
                )
              })}
              {(!product.documents || product.documents.length === 0) && product.passport && (
                <a href={product.passport} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 px-5 py-3.5 bg-white border border-neutral-200 rounded-xl hover:border-blue-200 hover:bg-blue-50/50 transition-colors">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <FileText size={20} className="text-red-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-neutral-800">Паспорт товара</div>
                    <div className="text-xs text-neutral-400">PDF</div>
                  </div>
                  <Download size={16} className="text-neutral-400" />
                </a>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
