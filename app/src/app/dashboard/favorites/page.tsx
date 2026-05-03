'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Heart, Trash2, FileText, Package } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { addToQuote } from '@/lib/quote-store'

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    fetch('/api/favorites').then(r => r.ok ? r.json() : []).then(d => {
      setFavorites(Array.isArray(d) ? d : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const removeFav = async (productId: string) => {
    await fetch('/api/favorites', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
    })
    setFavorites(f => f.filter(fav => fav.productId !== productId))
  }

  const addKP = (fav: any) => {
    const p = fav.product
    addToQuote({
      productId: p.id,
      name: p.name,
      sku: p.sku || '',
      image: p.images?.[0]?.url || '',
      price: p.prices?.[0]?.priceRetail || p.prices?.[0]?.priceDealer || p.prices?.[0]?.rrp || 0,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Избранное</h1>
        <p className="text-sm text-neutral-500 mt-0.5">{favorites.length} товаров</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{[1,2,3,4].map(i => <div key={i} className="h-24 bg-white rounded-xl animate-pulse" />)}</div>
      ) : favorites.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
          <Heart size={48} className="mx-auto text-neutral-200 mb-4" />
          <h3 className="font-bold text-neutral-700 text-lg">Нет избранных товаров</h3>
          <p className="text-sm text-neutral-400 mt-1">Добавляйте товары из каталога нажатием на сердечко</p>
          <Link href="/catalog" className="inline-block mt-4 px-5 py-2.5 bg-[#377efa] text-white text-sm font-semibold rounded-xl">Перейти в каталог</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {favorites.map((fav: any) => {
            const p = fav.product
            if (!p) return null
            const img = p.images?.[0]?.url || ''
            const price = p.prices?.[0]?.priceRetail || p.prices?.[0]?.priceDealer || p.prices?.[0]?.rrp
            return (
              <motion.div key={fav.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 p-4 bg-white rounded-xl border border-neutral-200 hover:border-blue-200 transition-all">
                <Link href={`/product/${p.slug}`} className="w-16 h-16 rounded-lg bg-neutral-50 overflow-hidden shrink-0 flex items-center justify-center">
                  {img ? <Image src={img} alt={p.name} width={64} height={64} className="object-contain" unoptimized onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} /> :
                    <Package size={20} className="text-neutral-300" />}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/product/${p.slug}`} className="text-sm font-medium hover:text-[#377efa] transition-colors truncate block">{p.name}</Link>
                  <div className="text-xs text-neutral-400 mt-0.5">{p.brand?.name} {p.sku && `· ${p.sku}`}</div>
                  <div className="mt-1 font-bold text-sm">{price ? formatPrice(price) : 'По запросу'}</div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => addKP(fav)} className="p-2 text-[#377efa] hover:bg-blue-50 rounded-lg transition-colors" title="В КП">
                    <FileText size={16} />
                  </button>
                  <button onClick={() => removeFav(fav.productId)} className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Удалить">
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
