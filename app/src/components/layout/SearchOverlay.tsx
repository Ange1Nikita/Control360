'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Tag, Package } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

interface SearchResult {
  products: { id: string; name: string; slug: string; sku: string | null; brand: { name: string } | null; category: { name: string } | null; image: string | null }[]
  categories: { id: string; name: string; slug: string; count: number }[]
  brands: { id: string; name: string; slug: string; count: number }[]
}

export default function SearchOverlay() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Debounced search
  useEffect(() => {
    if (query.length < 1) { setResults(null); return }
    setLoading(true)
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data)
        setOpen(true)
      } catch {} finally { setLoading(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/catalog?q=${encodeURIComponent(query.trim())}`)
      setOpen(false)
      setQuery('')
    }
  }

  const handleLinkClick = () => { setOpen(false); setQuery('') }

  const hasResults = results && (results.products.length > 0 || results.categories.length > 0 || results.brands.length > 0)

  return (
    <div ref={ref} className="flex-1 max-w-md mx-3 relative">
      <form onSubmit={handleSubmit} className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)] group-focus-within:text-[var(--brand)] transition-colors" size={15} />
        <input type="text" placeholder="Поиск по артикулу или названию..."
          value={query} onChange={e => setQuery(e.target.value)} onFocus={() => results && setOpen(true)}
          className="w-full pl-9 pr-8 py-2 text-[13px] bg-[var(--brand-bg)]/40 border border-transparent rounded-xl
            placeholder:text-[var(--text-3)] focus:bg-white focus:border-[var(--brand-pale)] focus:shadow-[0_0_0_3px_rgba(55,126,250,0.1)]
            outline-none transition-all duration-200" />
        {query && (
          <button type="button" onClick={() => { setQuery(''); setResults(null); setOpen(false) }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
            <X size={14} />
          </button>
        )}
      </form>

      <AnimatePresence>
        {open && query.length >= 1 && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-neutral-200 shadow-xl overflow-hidden z-50 max-h-[70vh] overflow-y-auto">

            {loading && (
              <div className="px-4 py-3 text-xs text-neutral-400">Поиск...</div>
            )}

            {!loading && !hasResults && (
              <div className="px-4 py-6 text-center text-sm text-neutral-400">
                Ничего не найдено по запросу «{query}»
              </div>
            )}

            {!loading && hasResults && (
              <>
                {/* Categories */}
                {results!.categories.length > 0 && (
                  <div className="px-3 pt-3 pb-1">
                    <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1 px-1">Категории</div>
                    {results!.categories.map(c => (
                      <Link key={c.id} href={`/catalog?category=${c.slug}`} onClick={handleLinkClick}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                        <Tag size={14} className="text-[#377efa]" />
                        <span className="text-sm">{c.name}</span>
                        <span className="text-xs text-neutral-400 ml-auto">{c.count}</span>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Brands */}
                {results!.brands.length > 0 && (
                  <div className="px-3 pt-2 pb-1">
                    <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1 px-1">Бренды</div>
                    {results!.brands.map(b => (
                      <Link key={b.id} href={`/catalog?brand=${b.slug}`} onClick={handleLinkClick}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                        <span className="text-sm font-medium">{b.name}</span>
                        <span className="text-xs text-neutral-400 ml-auto">{b.count}</span>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Products */}
                {results!.products.length > 0 && (
                  <div className="px-3 pt-2 pb-2 border-t border-neutral-100">
                    <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1 px-1">Товары</div>
                    {results!.products.map(p => (
                      <Link key={p.id} href={`/product/${p.slug}`} onClick={handleLinkClick}
                        className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-blue-50 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-neutral-100 overflow-hidden shrink-0 flex items-center justify-center">
                          {p.image ? <img src={p.image} alt="" className="w-full h-full object-contain" /> : <Package size={14} className="text-neutral-300" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{p.name}</div>
                          <div className="text-xs text-neutral-400">
                            {p.brand?.name && <span>{p.brand.name}</span>}
                            {p.sku && <span className="ml-2">Арт: {p.sku}</span>}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Search all */}
                <div className="border-t border-neutral-100 px-3 py-2">
                  <button onClick={handleSubmit as any}
                    className="w-full text-center text-xs font-medium text-[#377efa] hover:text-[#2b6be6] py-1 transition-colors">
                    Показать все результаты по «{query}» →
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
