'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, SlidersHorizontal, Grid3X3, List, Heart, ChevronRight, X, ChevronLeft, ChevronDown, Package } from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
}

interface Product {
  id: string
  name: string
  slug: string
  sku: string | null
  model: string | null
  images: { url: string; alt: string | null }[]
  brand: { name: string; slug: string } | null
  category: { name: string; slug: string } | null
  prices: { rrp: number | null; priceRetail: number | null; priceDealer: number | null; priceCash: number | null } | null
  stock: { warehouse: string; quantity: number }[]
}

interface Category {
  id: string
  name: string
  slug: string
  _count: { products: number }
  children?: Category[]
}

interface Brand {
  id: string
  name: string
  slug: string
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-6"><div className="h-96 animate-pulse bg-neutral-50 rounded-xl" /></div>}>
      <CatalogContent />
    </Suspense>
  )
}

function CatalogContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [filtersOpen, setFiltersOpen] = useState(true)

  const selectedCategory = searchParams.get('category') || ''
  const selectedBrand = searchParams.get('brand') || ''

  // Load categories and brands
  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(d => setCategories(Array.isArray(d) ? d : [])).catch(() => {})
    fetch('/api/brands').then(r => r.json()).then(d => setBrands(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  // Load products
  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (search) params.set('q', search)
      if (selectedCategory) params.set('category', selectedCategory)
      if (selectedBrand) params.set('brand', selectedBrand)
      const res = await fetch(`/api/products?${params}`)
      const data = await res.json()
      setProducts(data.items || [])
      setTotal(data.total || 0)
      setPages(data.pages || 1)
    } catch {
      setProducts([])
    }
    setLoading(false)
  }, [page, search, selectedCategory, selectedBrand])

  useEffect(() => { loadProducts() }, [loadProducts])

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1) }, 300)
    return () => clearTimeout(t)
  }, [searchInput])

  // Update URL when filters change
  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page')
    router.push(`/catalog?${params.toString()}`, { scroll: false })
    setPage(1)
  }

  // Find current category name
  const currentCategoryName = categories.flatMap(c => [c, ...(c.children || [])]).find(c => c.slug === selectedCategory)?.name
  const currentBrandName = brands.find(b => b.slug === selectedBrand)?.name

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-neutral-400 mb-6 flex-wrap">
        <Link href="/" className="hover:text-neutral-700 transition-colors">Главная</Link>
        <ChevronRight size={14} />
        <Link href="/catalog" className={cn('transition-colors', !selectedCategory ? 'text-neutral-900 font-medium' : 'hover:text-neutral-700')}>Каталог</Link>
        {currentCategoryName && (
          <>
            <ChevronRight size={14} />
            <span className="text-neutral-900 font-medium">{currentCategoryName}</span>
          </>
        )}
        {currentBrandName && (
          <>
            <ChevronRight size={14} />
            <span className="text-neutral-900 font-medium">{currentBrandName}</span>
          </>
        )}
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {currentCategoryName || 'Каталог оборудования'}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">{total} товаров</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
            <input
              type="text" placeholder="Поиск..." value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {searchInput && (
              <button onClick={() => setSearchInput('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                <X size={14} />
              </button>
            )}
          </div>

          <button onClick={() => setFiltersOpen(!filtersOpen)}
            className={cn('p-2 rounded-lg border transition-all lg:hidden', filtersOpen ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-neutral-200 text-neutral-500 hover:bg-neutral-50')}>
            <SlidersHorizontal size={18} />
          </button>

          <div className="hidden sm:flex border border-neutral-200 rounded-lg overflow-hidden">
            <button onClick={() => setViewMode('grid')}
              className={cn('p-2 transition-colors', viewMode === 'grid' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-400 hover:text-neutral-600')}>
              <Grid3X3 size={16} />
            </button>
            <button onClick={() => setViewMode('list')}
              className={cn('p-2 transition-colors', viewMode === 'list' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-400 hover:text-neutral-600')}>
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Active filters */}
      {(selectedCategory || selectedBrand) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {currentCategoryName && (
            <button onClick={() => setFilter('category', '')}
              className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200 hover:bg-blue-100 transition-colors">
              {currentCategoryName} <X size={12} />
            </button>
          )}
          {currentBrandName && (
            <button onClick={() => setFilter('brand', '')}
              className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200 hover:bg-blue-100 transition-colors">
              {currentBrandName} <X size={12} />
            </button>
          )}
          <button onClick={() => router.push('/catalog')}
            className="px-3 py-1 text-xs text-neutral-500 hover:text-neutral-700 transition-colors">
            Сбросить все
          </button>
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar filters */}
        <aside className={cn('w-64 shrink-0 space-y-6', filtersOpen ? 'block' : 'hidden lg:block')}>
          {/* Categories */}
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <h3 className="font-semibold text-sm mb-3">Категории</h3>
            <div className="space-y-0.5 max-h-[400px] overflow-y-auto">
              <button
                onClick={() => setFilter('category', '')}
                className={cn('block w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors',
                  !selectedCategory ? 'bg-blue-50 text-blue-700 font-medium' : 'text-neutral-600 hover:bg-neutral-50')}
              >
                Все категории
              </button>
              {categories.map(cat => {
                const totalProducts = cat._count.products + (cat.children?.reduce((sum: number, c: Category) => sum + c._count.products, 0) || 0)
                const isParentSelected = selectedCategory === cat.slug
                const isChildSelected = cat.children?.some((c: Category) => c.slug === selectedCategory) || false
                const showChildren = isParentSelected || isChildSelected || (cat.children && cat.children.length > 0)
                return (
                  <div key={cat.id}>
                    <button
                      onClick={() => setFilter('category', cat.slug)}
                      className={cn('block w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors',
                        isParentSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'text-neutral-600 hover:bg-neutral-50')}
                    >
                      {cat.name}
                      <span className="text-neutral-400 text-xs ml-1">({totalProducts})</span>
                    </button>
                    {showChildren && cat.children?.map((child: Category) => (
                      <button key={child.id}
                        onClick={() => setFilter('category', child.slug)}
                        className={cn('block w-full text-left pl-6 pr-2 py-1 rounded-lg text-xs transition-colors',
                          selectedCategory === child.slug ? 'bg-blue-50 text-blue-700 font-medium' : 'text-neutral-500 hover:bg-neutral-50')}
                      >
                        {child.name}
                        <span className="text-neutral-400 ml-1">({child._count.products})</span>
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Brands */}
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <h3 className="font-semibold text-sm mb-3">Бренды</h3>
            <div className="space-y-0.5 max-h-[300px] overflow-y-auto">
              <button
                onClick={() => setFilter('brand', '')}
                className={cn('block w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors',
                  !selectedBrand ? 'bg-blue-50 text-blue-700 font-medium' : 'text-neutral-600 hover:bg-neutral-50')}
              >
                Все бренды
              </button>
              {brands.map(brand => (
                <button key={brand.id}
                  onClick={() => setFilter('brand', brand.slug)}
                  className={cn('block w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors',
                    selectedBrand === brand.slug ? 'bg-blue-50 text-blue-700 font-medium' : 'text-neutral-600 hover:bg-neutral-50')}
                >
                  {brand.name}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Products */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className={cn('grid gap-4', viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1')}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-neutral-50 rounded-xl animate-pulse aspect-[3/4]" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-4xl mb-3">📦</div>
              <h3 className="text-lg font-semibold text-neutral-700">Товары не найдены</h3>
              <p className="text-sm text-neutral-400 mt-1">Попробуйте изменить параметры поиска</p>
            </div>
          ) : (
            <motion.div
              initial="initial" animate="animate"
              variants={{ animate: { transition: { staggerChildren: 0.04 } } }}
              className={cn('grid gap-4', viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1')}
            >
              {products.map(product => (
                viewMode === 'grid'
                  ? <ProductCard key={product.id} product={product} />
                  : <ProductRow key={product.id} product={product} />
              ))}
            </motion.div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-30 transition-all">
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
                let p: number
                if (pages <= 7) p = i + 1
                else if (page <= 4) p = i + 1
                else if (page >= pages - 3) p = pages - 6 + i
                else p = page - 3 + i
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={cn('w-9 h-9 rounded-lg text-sm font-medium transition-all',
                      p === page ? 'bg-blue-600 text-white' : 'border border-neutral-200 hover:bg-neutral-50')}>
                    {p}
                  </button>
                )
              })}
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                className="p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-30 transition-all">
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ProductImage({ images, alt, fill, className, sizes }: { images: string[]; alt: string; fill?: boolean; className?: string; sizes?: string }) {
  const [idx, setIdx] = useState(0)
  const [exhausted, setExhausted] = useState(false)

  const validImages = images.filter(Boolean)

  if (exhausted || validImages.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-neutral-100">
        <div className="text-center">
          <Package size={28} className="mx-auto text-neutral-300 mb-1" />
          <span className="text-[10px] text-neutral-400">Нет фото</span>
        </div>
      </div>
    )
  }

  return (
    <Image
      key={validImages[idx]}
      src={validImages[idx]}
      alt={alt}
      fill={fill}
      className={className}
      sizes={sizes}
      unoptimized
      onError={() => {
        if (idx + 1 < validImages.length) {
          setIdx(idx + 1)
        } else {
          setExhausted(true)
        }
      }}
    />
  )
}

function ProductCard({ product }: { product: Product }) {
  const allImages = (product as any).allImages || product.images?.map((i: any) => i.url) || []
  const price = product.prices?.priceRetail || product.prices?.priceDealer || product.prices?.rrp

  return (
    <motion.div variants={fadeUp}>
      <Link href={`/product/${product.slug}`}
        className="group block bg-white rounded-xl border border-neutral-100 overflow-hidden hover:border-blue-200 hover:shadow-lg transition-all duration-300">
        <div className="relative aspect-square bg-neutral-50 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="relative w-full h-full">
              <ProductImage images={allImages} alt={product.name} fill className="object-contain group-hover:scale-105 transition-transform duration-500" sizes="(max-width:768px) 50vw, 25vw" />
            </div>
          </div>
          <button className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur rounded-full text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all z-10"
            onClick={e => e.preventDefault()}>
            <Heart size={16} />
          </button>
        </div>
        <div className="p-3">
          {product.brand && <div className="text-xs text-blue-600 font-medium mb-1">{product.brand.name}</div>}
          <h3 className="text-sm font-medium text-neutral-900 leading-tight line-clamp-2 min-h-[2.5rem]">{product.name}</h3>
          {product.sku && <div className="text-xs text-neutral-400 mt-1">Арт: {product.sku}</div>}
          <div className="mt-2 flex items-baseline gap-2">
            {price ? (
              <span className="text-base font-bold text-neutral-900">{formatPrice(price)}</span>
            ) : (
              <span className="text-sm text-neutral-400">Цена по запросу</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

function ProductRow({ product }: { product: Product }) {
  const allImages = (product as any).allImages || product.images?.map((i: any) => i.url) || []
  const price = product.prices?.priceRetail || product.prices?.priceDealer || product.prices?.rrp

  return (
    <motion.div variants={fadeUp}>
      <Link href={`/product/${product.slug}`}
        className="group flex gap-4 bg-white rounded-xl border border-neutral-100 p-3 hover:border-blue-200 hover:shadow-md transition-all duration-300">
        <div className="relative w-20 h-20 bg-neutral-50 rounded-lg overflow-hidden shrink-0">
          <ProductImage images={allImages} alt={product.name} fill className="object-contain" sizes="80px" />
        </div>
        <div className="flex-1 min-w-0">
          {product.brand && <div className="text-xs text-blue-600 font-medium">{product.brand.name}</div>}
          <h3 className="text-sm font-medium truncate">{product.name}</h3>
          {product.sku && <div className="text-xs text-neutral-400">Арт: {product.sku}</div>}
          {product.category && <div className="text-xs text-neutral-400 mt-0.5">{product.category.name}</div>}
        </div>
        <div className="text-right shrink-0">
          {price ? <div className="font-bold">{formatPrice(price)}</div> : <div className="text-sm text-neutral-400">По запросу</div>}
        </div>
      </Link>
    </motion.div>
  )
}
