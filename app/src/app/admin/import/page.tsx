'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Upload, FileText, Image as ImageIcon, DollarSign, CheckCircle, AlertCircle, Loader2, MapPin, FolderOpen, Trash2, Package, Pencil, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } }

type Tab = 'catalog' | 'folder' | 'products' | 'prices' | 'images'

export default function AdminImportPage() {
  const [tab, setTab] = useState<Tab>('catalog')

  const tabs: { id: Tab; icon: typeof FileText; label: string; desc: string }[] = [
    { id: 'catalog', icon: Package, label: 'Загруженные товары', desc: 'Просмотр и управление' },
    { id: 'folder', icon: FolderOpen, label: 'Папка бренда', desc: 'FOX, KENO, Viguard...' },
    { id: 'products', icon: FileText, label: 'Товары (XML/JSON)', desc: 'Импорт каталога' },
    { id: 'prices', icon: DollarSign, label: 'Прайс-лист', desc: 'CSV с ценами' },
    { id: 'images', icon: ImageIcon, label: 'Фотографии', desc: 'Массовая загрузка' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <motion.div {...fadeUp}>
        <h1 className="text-2xl font-bold">Импорт данных</h1>
        <p className="text-sm text-neutral-500 mt-1">Загрузка товаров, цен и фотографий</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-3 mt-6 mb-8 flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('flex items-center gap-3 p-4 rounded-xl border transition-all flex-1 min-w-[160px]',
              tab === t.id ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-neutral-200 hover:border-neutral-300')}>
            <t.icon size={20} className={tab === t.id ? 'text-blue-600' : 'text-neutral-400'} />
            <div className="text-left">
              <div className={cn('text-sm font-semibold', tab === t.id ? 'text-blue-700' : 'text-neutral-700')}>{t.label}</div>
              <div className="text-xs text-neutral-400">{t.desc}</div>
            </div>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
          {tab === 'catalog' && <LoadedProducts />}
          {tab === 'folder' && <ImportFolder />}
          {tab === 'products' && <ImportProducts />}
          {tab === 'prices' && <ImportPrices />}
          {tab === 'images' && <ImportImages />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

/* ======================== LOADED PRODUCTS ======================== */
type BrandSummary = { brandId: string; brandName: string; brandSlug: string; count: number }

function LoadedProducts() {
  const [brands, setBrands] = useState<BrandSummary[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [brandProducts, setBrandProducts] = useState<Record<string, any[]>>({})
  const [loadingProducts, setLoadingProducts] = useState<string | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<string | null>(null)

  const loadSummary = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/products/summary')
      if (res.ok) {
        const data = await res.json()
        setBrands(data.items)
        setTotal(data.total)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { loadSummary() }, [loadSummary])

  const loadBrandProducts = async (brandId: string) => {
    if (expanded === brandId) { setExpanded(null); return }
    setExpanded(brandId)
    if (brandProducts[brandId]) return

    setLoadingProducts(brandId)
    try {
      const params = new URLSearchParams({ limit: '100', brandId })
      const res = await fetch(`/api/admin/products?${params}`)
      if (res.ok) {
        const data = await res.json()
        setBrandProducts(prev => ({ ...prev, [brandId]: data.items || [] }))
      }
    } catch { /* ignore */ }
    setLoadingProducts(null)
  }

  const deleteBrand = async (brandId: string) => {
    setDeleting(brandId)
    try {
      const res = await fetch('/api/admin/products/summary', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId }),
      })
      if (res.ok) {
        setBrandProducts(prev => { const n = { ...prev }; delete n[brandId]; return n })
        setExpanded(null)
        await loadSummary()
      }
    } catch { /* ignore */ }
    setDeleting(null)
    setConfirmDelete(null)
  }

  const deleteProduct = async (productId: string, brandId: string) => {
    setDeletingProduct(productId)
    try {
      const res = await fetch(`/api/admin/products/${productId}`, { method: 'DELETE' })
      if (res.ok) {
        setBrandProducts(prev => ({
          ...prev,
          [brandId]: (prev[brandId] || []).filter(p => p.id !== productId),
        }))
        await loadSummary()
      }
    } catch { /* ignore */ }
    setDeletingProduct(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-blue-600" size={28} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-sm">Загруженные товары по брендам</h3>
          <span className="text-xs text-neutral-400">Всего: {total} товаров</span>
        </div>
        <p className="text-xs text-neutral-400 mb-4">
          Разверните бренд, чтобы увидеть товары. Можно удалить отдельный товар или все товары бренда сразу.
        </p>

        {brands.length === 0 ? (
          <div className="text-center py-10 text-neutral-400">
            <Package size={36} className="mx-auto mb-3" />
            <p className="text-sm">Товары ещё не загружены</p>
            <p className="text-xs mt-1">Используйте вкладку «Папка бренда» или «Товары (XML/JSON)» для импорта</p>
          </div>
        ) : (
          <div className="space-y-3">
            {brands.map(brand => (
              <div key={brand.brandId} className="border border-neutral-200 rounded-xl overflow-hidden hover:border-neutral-300 transition-colors">
                {/* Brand card header */}
                <div className="p-4 flex items-center justify-between">
                  <button onClick={() => loadBrandProducts(brand.brandId)} className="flex items-center gap-3 flex-1 text-left">
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold',
                      brand.brandId === '__none__' ? 'bg-neutral-100 text-neutral-500' : 'bg-blue-50 text-blue-600')}>
                      {brand.brandName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{brand.brandName}</h4>
                      <p className="text-xs text-neutral-400">
                        {brand.count} {brand.count === 1 ? 'товар' : brand.count < 5 ? 'товара' : 'товаров'}
                      </p>
                    </div>
                    <div className={cn('ml-2 transition-transform text-neutral-400', expanded === brand.brandId && 'rotate-180')}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  </button>

                  <div className="flex items-center gap-2 ml-3">
                    {brand.brandSlug && (
                      <Link href={`/admin/products?brand=${brand.brandSlug}`}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-blue-600 hover:bg-blue-50 text-xs font-medium rounded-lg transition-colors">
                        <ExternalLink size={14} /> Все товары
                      </Link>
                    )}

                    {confirmDelete === brand.brandId ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-red-600 whitespace-nowrap">Удалить все?</span>
                        <button onClick={() => deleteBrand(brand.brandId)} disabled={deleting === brand.brandId}
                          className="px-2.5 py-1 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
                          {deleting === brand.brandId ? <Loader2 size={12} className="animate-spin" /> : 'Да'}
                        </button>
                        <button onClick={() => setConfirmDelete(null)}
                          className="px-2.5 py-1 bg-neutral-100 text-neutral-600 text-xs font-medium rounded-lg hover:bg-neutral-200 transition-colors">
                          Нет
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDelete(brand.brandId)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-red-600 hover:bg-red-50 text-xs font-medium rounded-lg transition-colors">
                        <Trash2 size={14} /> Удалить все
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded product list */}
                {expanded === brand.brandId && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} transition={{ duration: 0.2 }}
                    className="border-t border-neutral-100">
                    {loadingProducts === brand.brandId ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 size={18} className="animate-spin text-neutral-400" />
                      </div>
                    ) : (
                      <div className="max-h-[400px] overflow-y-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-neutral-50 sticky top-0">
                            <tr>
                              <th className="px-4 py-2 text-left font-semibold text-neutral-500">Товар</th>
                              <th className="px-4 py-2 text-left font-semibold text-neutral-500">Артикул</th>
                              <th className="px-4 py-2 text-left font-semibold text-neutral-500">Категория</th>
                              <th className="px-4 py-2 text-right font-semibold text-neutral-500">Действия</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-50">
                            {(brandProducts[brand.brandId] || []).map((p: any) => {
                              const mainImage = p.images?.find((i: any) => i.isMain) || p.images?.[0]
                              return (
                                <tr key={p.id} className="hover:bg-neutral-50 transition-colors">
                                  <td className="px-4 py-2.5">
                                    <div className="flex items-center gap-2">
                                      {mainImage ? (
                                        <img src={mainImage.url} alt="" className="w-8 h-8 rounded object-cover border border-neutral-200" />
                                      ) : (
                                        <div className="w-8 h-8 rounded bg-neutral-100 flex items-center justify-center">
                                          <Package size={12} className="text-neutral-400" />
                                        </div>
                                      )}
                                      <span className="font-medium truncate max-w-[250px]">{p.name}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-2.5 text-neutral-500 font-mono">{p.sku || '—'}</td>
                                  <td className="px-4 py-2.5 text-neutral-500">{p.category?.name || '—'}</td>
                                  <td className="px-4 py-2.5">
                                    <div className="flex items-center gap-1 justify-end">
                                      <Link href={`/admin/products/${p.id}`}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Редактировать">
                                        <Pencil size={14} />
                                      </Link>
                                      <button onClick={() => deleteProduct(p.id, brand.brandId)}
                                        disabled={deletingProduct === p.id}
                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50" title="Удалить">
                                        {deletingProduct === p.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                            {(brandProducts[brand.brandId] || []).length === 0 && (
                              <tr><td colSpan={4} className="px-4 py-6 text-center text-neutral-400">Нет товаров</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ======================== FOLDER IMPORT ======================== */
type FolderInfo = { name: string; path: string; hasOutput: boolean; productCount: number; categories: string[] }

function ImportFolder() {
  const [folders, setFolders] = useState<FolderInfo[]>([])
  const [loadingFolders, setLoadingFolders] = useState(true)
  const [importing, setImporting] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, any>>({})

  const loadFolders = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/import/folders')
      if (res.ok) {
        const data = await res.json()
        setFolders(data.folders || [])
      }
    } catch { /* ignore */ }
    setLoadingFolders(false)
  }, [])

  useEffect(() => { loadFolders() }, [loadFolders])

  const doImport = async (folderPath: string, label: string) => {
    setImporting(label)
    try {
      const res = await fetch('/api/admin/import/folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath }),
      })
      const data = await res.json()
      setResults(prev => ({ ...prev, [label]: data }))
    } catch (e) {
      setResults(prev => ({ ...prev, [label]: { error: 'Ошибка соединения' } }))
    }
    setImporting(null)
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-sm">Импорт папки бренда</h3>
          <button onClick={() => { setLoadingFolders(true); loadFolders() }}
            className="text-xs text-blue-600 hover:underline">Обновить</button>
        </div>
        <p className="text-xs text-neutral-400 mb-4">
          Папки из корня проекта с product.xml. Нажмите «Импорт» чтобы загрузить товары на сайт.
        </p>

        {loadingFolders ? (
          <div className="flex items-center gap-2 text-neutral-400 text-sm py-6 justify-center">
            <Loader2 size={16} className="animate-spin" /> Сканирование папок...
          </div>
        ) : folders.length === 0 ? (
          <div className="text-center py-8 text-neutral-400">
            <FolderOpen size={32} className="mx-auto mb-2" />
            <p className="text-sm">Папки с товарами не найдены</p>
            <p className="text-xs mt-1">Добавьте папку бренда с output/product.xml в корень проекта</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {folders.map(folder => {
              const result = results[folder.name]
              const isImporting = importing === folder.name
              return (
                <div key={folder.name} className={cn(
                  'border rounded-xl p-4 transition-colors',
                  folder.hasOutput ? 'border-neutral-200 hover:border-blue-200' : 'border-dashed border-neutral-200 opacity-60'
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold',
                        folder.hasOutput ? 'bg-blue-50 text-blue-600' : 'bg-neutral-100 text-neutral-400')}>
                        {folder.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{folder.name}</h4>
                        {folder.hasOutput ? (
                          <p className="text-xs text-neutral-400">
                            {folder.productCount} товаров
                            {folder.categories.length > 0 && ` · ${folder.categories.length} категорий`}
                          </p>
                        ) : (
                          <p className="text-xs text-neutral-400">Нет output/</p>
                        )}
                      </div>
                    </div>
                    {folder.hasOutput && (
                      <button
                        onClick={() => doImport(folder.path, folder.name)}
                        disabled={isImporting || importing !== null}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {isImporting ? <><Loader2 size={14} className="animate-spin" /> Импорт...</> : <><Upload size={14} /> Импорт</>}
                      </button>
                    )}
                  </div>

                  {folder.hasOutput && folder.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {folder.categories.slice(0, 6).map(cat => (
                        <span key={cat} className="px-1.5 py-0.5 bg-neutral-100 rounded text-[10px] text-neutral-500">{cat}</span>
                      ))}
                      {folder.categories.length > 6 && (
                        <span className="px-1.5 py-0.5 text-[10px] text-neutral-400">+{folder.categories.length - 6}</span>
                      )}
                    </div>
                  )}

                  {result && (
                    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                      className={cn('mt-3 p-3 rounded-lg text-xs', result.error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200')}>
                      {result.error ? (
                        <div className="flex items-center gap-1"><AlertCircle size={14} /> {result.error}</div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1"><CheckCircle size={14} /> Найдено: <b>{result.total}</b> · Добавлено: <b>{result.imported}</b> · Обновлено: <b>{result.updated}</b> · Ошибок: <b>{result.errors}</b></div>
                          {result.categories?.length > 0 && (
                            <div className="text-green-600">Категории: {result.categories.join(', ')}</div>
                          )}
                          {result.brands?.length > 0 && (
                            <div className="text-green-600">Бренды: {result.brands.join(', ')}</div>
                          )}
                          {result.errorList?.length > 0 && (
                            <div className="mt-1 text-red-600 bg-red-50 rounded p-2 max-h-24 overflow-y-auto">
                              {result.errorList.map((e: string, i: number) => <div key={i}>{e}</div>)}
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/* ======================== PRODUCTS IMPORT ======================== */
function ImportProducts() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ imported: number; updated: number; errors: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (f: File) => {
    setFile(f)
    setResult(null)
    try {
      const text = await f.text()
      let data: any[]

      if (f.name.endsWith('.json')) {
        data = JSON.parse(text)
        if (!Array.isArray(data)) data = [data]
      } else if (f.name.endsWith('.xml')) {
        const parser = new DOMParser()
        const doc = parser.parseFromString(text, 'text/xml')
        const products = doc.querySelectorAll('product')
        data = Array.from(products).map(p => ({
          name: p.querySelector('name')?.textContent || '',
          sku: p.querySelector('article')?.textContent || p.querySelector('vendorCode')?.textContent || '',
          model: p.querySelector('model')?.textContent || '',
          brand: p.querySelector('brand,vendor')?.textContent || '',
          category: p.querySelector('category')?.textContent || '',
          description: p.querySelector('description')?.textContent || '',
          images: Array.from(p.querySelectorAll('image,picture')).map(img => img.textContent || ''),
          attributes: Array.from(p.querySelectorAll('spec,param')).map(s => ({
            name: s.getAttribute('name') || '',
            value: s.textContent || '',
          })),
        }))
      } else {
        return
      }

      setPreview(data.slice(0, 10))
    } catch { setPreview([]) }
  }

  const doImport = async () => {
    if (!file) return
    setImporting(true)
    try {
      const text = await file.text()
      let data: any[]

      if (file.name.endsWith('.json')) {
        data = JSON.parse(text)
      } else {
        const parser = new DOMParser()
        const doc = parser.parseFromString(text, 'text/xml')
        const products = doc.querySelectorAll('product')
        data = Array.from(products).map(p => ({
          name: p.querySelector('name')?.textContent || '',
          sku: p.querySelector('article')?.textContent || p.querySelector('vendorCode')?.textContent || '',
          model: p.querySelector('model')?.textContent || '',
          brand: p.querySelector('brand,vendor')?.textContent || '',
          category: p.querySelector('category')?.textContent || '',
          description: p.querySelector('description')?.textContent || '',
          images: Array.from(p.querySelectorAll('image,picture')).map(img => img.textContent || ''),
          attributes: Array.from(p.querySelectorAll('spec,param')).map(s => ({
            name: s.getAttribute('name') || '',
            value: s.textContent || '',
          })),
        }))
      }

      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: data, source: file.name }),
      })
      const r = await res.json()
      setResult(r)
    } catch { setResult({ imported: 0, updated: 0, errors: -1 }) }
    setImporting(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-blue-400', 'bg-blue-50') }}
        onDragLeave={e => { e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50') }}
        onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50'); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]) }}
        className="border-2 border-dashed border-neutral-300 rounded-xl p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all"
      >
        <input ref={inputRef} type="file" accept=".xml,.json" className="hidden"
          onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }} />
        <Upload className="mx-auto text-neutral-400 mb-3" size={32} />
        <p className="font-medium text-neutral-700">Перетащите файл или нажмите</p>
        <p className="text-xs text-neutral-400 mt-1">XML или JSON (формат парсера)</p>
      </div>

      {file && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm flex items-center gap-2">
          <FileText size={16} className="text-blue-600" />
          <span className="font-medium">{file.name}</span>
          <span className="text-blue-600">{(file.size / 1024).toFixed(0)} КБ</span>
        </div>
      )}

      {preview.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-sm mb-3">Превью (первые {preview.length} товаров)</h3>
          <div className="overflow-x-auto border border-neutral-200 rounded-lg">
            <table className="w-full text-xs">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Название</th>
                  <th className="px-3 py-2 text-left font-semibold">Артикул</th>
                  <th className="px-3 py-2 text-left font-semibold">Бренд</th>
                  <th className="px-3 py-2 text-left font-semibold">Категория</th>
                  <th className="px-3 py-2 text-left font-semibold">Фото</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {preview.map((p, i) => (
                  <tr key={i} className="hover:bg-neutral-50">
                    <td className="px-3 py-2 max-w-[200px] truncate">{p.name}</td>
                    <td className="px-3 py-2 text-neutral-500">{p.sku || '—'}</td>
                    <td className="px-3 py-2">{p.brand || '—'}</td>
                    <td className="px-3 py-2">{p.category || '—'}</td>
                    <td className="px-3 py-2">{p.images?.length || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button onClick={doImport} disabled={importing}
            className="mt-4 flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {importing ? <><Loader2 size={16} className="animate-spin" /> Импорт...</> : <><Upload size={16} /> Импортировать</>}
          </button>
        </div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className={cn('mt-4 p-4 rounded-lg border', result.errors === -1 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200')}>
          {result.errors === -1 ? (
            <div className="flex items-center gap-2 text-red-700"><AlertCircle size={18} /> Ошибка импорта</div>
          ) : (
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle size={18} />
              <span>Добавлено: <b>{result.imported}</b> · Обновлено: <b>{result.updated}</b> · Ошибок: <b>{result.errors}</b></span>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}

/* ======================== PRICE IMPORT ======================== */
const PRICE_FIELDS = [
  { key: 'sku', label: 'Артикул (SKU)' },
  { key: 'model', label: 'Модель' },
  { key: 'rrp', label: 'РРЦ' },
  { key: 'priceRetail', label: 'Розница' },
  { key: 'priceDealer', label: 'Дилер' },
  { key: 'priceCash', label: 'Нал' },
  { key: 'pricePartner', label: 'Партнёр' },
  { key: 'priceVip', label: 'VIP' },
]

function ImportPrices() {
  const [file, setFile] = useState<File | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ imported: number; errors: number; unmatched: string[] } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [priceLists, setPriceLists] = useState<{ source: string; count: number; updatedAt: string }[]>([])
  const [totalPrices, setTotalPrices] = useState(0)
  const [loadingLists, setLoadingLists] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const loadPriceLists = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/import/prices')
      if (res.ok) {
        const data = await res.json()
        setPriceLists(data.priceLists)
        setTotalPrices(data.total)
      }
    } catch { /* ignore */ }
    setLoadingLists(false)
  }, [])

  useEffect(() => { loadPriceLists() }, [loadPriceLists])

  const deletePriceList = async (source: string) => {
    setDeleting(source)
    try {
      const res = await fetch('/api/admin/import/prices', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source }),
      })
      if (res.ok) {
        await loadPriceLists()
      }
    } catch { /* ignore */ }
    setDeleting(null)
    setConfirmDelete(null)
  }

  const parseCSV = (text: string): { headers: string[]; rows: string[][] } => {
    const lines = text.split(/\r?\n/).filter(l => l.trim())
    if (lines.length < 2) return { headers: [], rows: [] }

    // Detect separator
    const firstLine = lines[0]
    let sep = ','
    if (firstLine.split(';').length > firstLine.split(',').length) sep = ';'
    if (firstLine.split('\t').length > firstLine.split(sep).length) sep = '\t'

    const parseLine = (line: string) => {
      const result: string[] = []
      let current = ''
      let inQuotes = false
      for (const ch of line) {
        if (ch === '"') { inQuotes = !inQuotes; continue }
        if (ch === sep && !inQuotes) { result.push(current.trim()); current = ''; continue }
        current += ch
      }
      result.push(current.trim())
      return result
    }

    const h = parseLine(lines[0])
    const r = lines.slice(1).map(parseLine)
    return { headers: h, rows: r }
  }

  const handleFile = async (f: File) => {
    setFile(f)
    setResult(null)
    setMapping({})
    const text = await f.text()
    const { headers: h, rows: r } = parseCSV(text)
    setHeaders(h)
    setRows(r)

    // Auto-detect mapping
    const autoMap: Record<string, string> = {}
    h.forEach((header, idx) => {
      const hl = header.toLowerCase()
      if (hl.includes('артикул') || hl.includes('sku') || hl === 'article') autoMap.sku = String(idx)
      if (hl.includes('модель') || hl === 'model') autoMap.model = String(idx)
      if (hl.includes('ррц') || hl === 'rrp' || hl.includes('рекоменд')) autoMap.rrp = String(idx)
      if (hl.includes('розни') || hl === 'retail') autoMap.priceRetail = String(idx)
      if (hl.includes('дилер') || hl === 'dealer') autoMap.priceDealer = String(idx)
      if (hl.includes('нал') || hl === 'cash') autoMap.priceCash = String(idx)
      if (hl.includes('партн') || hl === 'partner') autoMap.pricePartner = String(idx)
      if (hl.includes('vip') || hl.includes('вип')) autoMap.priceVip = String(idx)
      // Generic price column
      if (!autoMap.priceRetail && (hl.includes('цена') || hl === 'price')) autoMap.priceRetail = String(idx)
    })
    setMapping(autoMap)
  }

  const doImport = async () => {
    if (!rows.length) return
    setImporting(true)

    const items = rows.map(row => {
      const item: Record<string, any> = {}
      for (const field of PRICE_FIELDS) {
        const colIdx = mapping[field.key]
        if (colIdx !== undefined && colIdx !== '') {
          const val = row[parseInt(colIdx)]
          if (val) {
            if (field.key === 'sku' || field.key === 'model') {
              item[field.key] = val
            } else {
              const num = parseFloat(val.replace(/\s/g, '').replace(',', '.'))
              if (!isNaN(num)) item[field.key] = num
            }
          }
        }
      }
      return item
    }).filter(item => item.sku || item.model)

    try {
      const res = await fetch('/api/admin/import/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, filename: file?.name }),
      })
      const data = await res.json()
      setResult(data)
      await loadPriceLists()
    } catch {
      setResult({ imported: 0, errors: -1, unmatched: [] })
    }
    setImporting(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-6">
      {/* Upload zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-blue-400', 'bg-blue-50') }}
        onDragLeave={e => { e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50') }}
        onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50'); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]) }}
        className="border-2 border-dashed border-neutral-300 rounded-xl p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all"
      >
        <input ref={inputRef} type="file" accept=".csv,.txt,.tsv" className="hidden"
          onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }} />
        <DollarSign className="mx-auto text-neutral-400 mb-3" size={32} />
        <p className="font-medium text-neutral-700">Перетащите CSV файл с ценами или нажмите</p>
        <p className="text-xs text-neutral-400 mt-1">CSV (разделитель: ; , или Tab)</p>
      </div>

      {file && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm flex items-center gap-2">
          <FileText size={16} className="text-blue-600" />
          <span className="font-medium">{file.name}</span>
          <span className="text-blue-600">{rows.length} строк</span>
        </div>
      )}

      {/* Column mapping */}
      {headers.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={16} className="text-blue-600" />
            <h3 className="font-semibold text-sm">Сопоставление колонок</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PRICE_FIELDS.map(field => (
              <div key={field.key}>
                <label className="block text-xs font-medium text-neutral-600 mb-1">{field.label}</label>
                <select
                  value={mapping[field.key] || ''}
                  onChange={e => setMapping(m => ({ ...m, [field.key]: e.target.value }))}
                  className={cn('w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                    mapping[field.key] ? 'border-blue-300 bg-blue-50' : 'border-neutral-200')}
                >
                  <option value="">— не выбрано —</option>
                  {headers.map((h, i) => (
                    <option key={i} value={String(i)}>{h}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview */}
      {rows.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm mb-3">Превью (первые {Math.min(10, rows.length)} строк)</h3>
          <div className="overflow-x-auto border border-neutral-200 rounded-lg">
            <table className="w-full text-xs">
              <thead className="bg-neutral-50">
                <tr>
                  {headers.map((h, i) => {
                    const mapped = Object.entries(mapping).find(([_, v]) => v === String(i))
                    return (
                      <th key={i} className={cn('px-3 py-2 text-left font-semibold whitespace-nowrap', mapped ? 'bg-blue-50 text-blue-700' : '')}>
                        {h}
                        {mapped && <span className="block text-xs font-normal text-blue-500">{PRICE_FIELDS.find(f => f.key === mapped[0])?.label}</span>}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {rows.slice(0, 10).map((row, i) => (
                  <tr key={i} className="hover:bg-neutral-50">
                    {row.map((cell, j) => (
                      <td key={j} className="px-3 py-2 whitespace-nowrap max-w-[150px] truncate">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button onClick={doImport} disabled={importing || (!mapping.sku && !mapping.model)}
            className="mt-4 flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {importing ? <><Loader2 size={16} className="animate-spin" /> Импорт цен...</> : <><Upload size={16} /> Импортировать цены ({rows.length} строк)</>}
          </button>
          {!mapping.sku && !mapping.model && (
            <p className="mt-2 text-xs text-amber-600">Укажите хотя бы одну колонку: Артикул или Модель</p>
          )}
        </div>
      )}

      {/* Result */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className={cn('p-4 rounded-lg border', result.errors === -1 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200')}>
          {result.errors === -1 ? (
            <div className="flex items-center gap-2 text-red-700"><AlertCircle size={18} /> Ошибка импорта</div>
          ) : (
            <div>
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle size={18} />
                <span>Обновлено цен: <b>{result.imported}</b> · Не найдено: <b>{result.errors}</b></span>
              </div>
              {result.unmatched?.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-neutral-600 mb-1">Несопоставленные артикулы ({result.unmatched.length}):</p>
                  <div className="text-xs text-neutral-500 bg-neutral-50 rounded p-2 max-h-32 overflow-y-auto">
                    {result.unmatched.join(', ')}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Loaded price lists */}
      <div className="border-t border-neutral-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-sm">Загруженные прайсы</h3>
            <p className="text-xs text-neutral-400 mt-0.5">Всего записей с ценами: {totalPrices}</p>
          </div>
        </div>

        {loadingLists ? (
          <div className="flex items-center gap-2 text-neutral-400 text-sm py-4">
            <Loader2 size={16} className="animate-spin" /> Загрузка...
          </div>
        ) : priceLists.length === 0 ? (
          <div className="text-sm text-neutral-400 py-4">Нет загруженных прайсов</div>
        ) : (
          <div className="space-y-2">
            {priceLists.map(pl => (
              <div key={pl.source} className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors">
                <div className="flex items-center gap-3">
                  <DollarSign size={16} className="text-neutral-400" />
                  <div>
                    <div className="text-sm font-medium">{pl.source}</div>
                    <div className="text-xs text-neutral-400">
                      {pl.count} {pl.count === 1 ? 'товар' : pl.count < 5 ? 'товара' : 'товаров'} · обновлён {new Date(pl.updatedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {confirmDelete === pl.source ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-600">Удалить?</span>
                      <button
                        onClick={() => deletePriceList(pl.source)}
                        disabled={deleting === pl.source}
                        className="px-2.5 py-1 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                      >
                        {deleting === pl.source ? <Loader2 size={12} className="animate-spin" /> : 'Да'}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="px-2.5 py-1 bg-neutral-100 text-neutral-600 text-xs font-medium rounded-lg hover:bg-neutral-200 transition-colors"
                      >
                        Нет
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(pl.source)}
                      className="flex items-center gap-1 px-2.5 py-1 text-red-600 hover:bg-red-50 text-xs font-medium rounded-lg transition-colors"
                    >
                      <Trash2 size={14} /> Удалить
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ======================== IMAGES IMPORT ======================== */
function ImportImages() {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-8 text-center">
      <ImageIcon className="mx-auto text-neutral-300 mb-4" size={40} />
      <h3 className="font-semibold text-lg">Массовая загрузка фотографий</h3>
      <p className="text-sm text-neutral-400 mt-2 max-w-md mx-auto">
        Загрузите папку с фотографиями. Система сопоставит фото с товарами по имени файла (артикул или модель).
      </p>
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 max-w-md mx-auto text-left">
        <p className="font-semibold mb-1">Формат файлов:</p>
        <ul className="space-y-0.5 list-disc list-inside">
          <li><b>артикул.jpg</b> — основное фото</li>
          <li><b>артикул_1.jpg</b>, <b>артикул_2.jpg</b> — дополнительные</li>
          <li>Поддерживаются: JPG, PNG, WebP</li>
        </ul>
      </div>
      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 max-w-md mx-auto">
        Для загрузки фотографий необходимо настроить S3-хранилище. Раздел в разработке.
      </div>
    </div>
  )
}
