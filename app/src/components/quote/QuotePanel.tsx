'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Minus, Plus, Trash2, FileText, ShoppingCart } from 'lucide-react'
import { useQuoteStore, removeFromQuote, updateQuantity, clearQuote } from '@/lib/quote-store'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'

interface Props {
  open: boolean
  onClose: () => void
}

export default function QuotePanel({ open, onClose }: Props) {
  const { items, count, total } = useQuoteStore()

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60]" onClick={onClose} />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[61] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-[#377efa]" />
                <h2 className="font-bold text-[15px]">Коммерческое предложение</h2>
                {count > 0 && (
                  <span className="px-2 py-0.5 bg-[#377efa] text-white text-xs font-bold rounded-full">{count}</span>
                )}
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Items */}
            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                <ShoppingCart size={48} className="text-neutral-200 mb-4" />
                <p className="font-semibold text-neutral-700">КП пока пусто</p>
                <p className="text-sm text-neutral-400 mt-1">Добавьте товары из каталога</p>
                <Link href="/catalog" onClick={onClose}
                  className="mt-4 px-5 py-2 bg-[#377efa] text-white text-sm font-semibold rounded-xl hover:bg-[#2b6be6] transition-colors">
                  Перейти в каталог
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
                  {items.map(item => (
                    <div key={item.productId} className="flex gap-3 p-3 bg-neutral-50 rounded-xl">
                      {/* Image */}
                      <div className="w-14 h-14 rounded-lg bg-white border border-neutral-200 overflow-hidden shrink-0 flex items-center justify-center">
                        {item.image ? (
                          <img src={item.image} alt="" className="w-full h-full object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        ) : (
                          <FileText size={16} className="text-neutral-300" />
                        )}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-neutral-400">{item.sku}</p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="w-6 h-6 flex items-center justify-center bg-white border border-neutral-200 rounded text-neutral-500 hover:border-[#377efa] hover:text-[#377efa] transition-colors">
                              <Minus size={12} />
                            </button>
                            <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="w-6 h-6 flex items-center justify-center bg-white border border-neutral-200 rounded text-neutral-500 hover:border-[#377efa] hover:text-[#377efa] transition-colors">
                              <Plus size={12} />
                            </button>
                          </div>
                          <span className="text-sm font-bold">{item.price > 0 ? formatPrice(item.price * item.quantity) : 'По запросу'}</span>
                        </div>
                      </div>
                      {/* Remove */}
                      <button onClick={() => removeFromQuote(item.productId)}
                        className="p-1 text-neutral-300 hover:text-red-500 transition-colors self-start">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="border-t border-neutral-100 px-5 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-500">Итого ({count} поз.)</span>
                    <span className="text-lg font-bold">{total > 0 ? formatPrice(total) : 'По запросу'}</span>
                  </div>
                  <Link href="/dashboard/quotes/new" onClick={onClose}
                    className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-gradient-to-r from-[#377efa] to-[#5b8cff] text-white font-semibold text-sm rounded-xl
                      shadow-[0_2px_12px_rgba(55,126,250,0.3)] hover:shadow-[0_4px_20px_rgba(55,126,250,0.4)] hover:translate-y-[-1px] transition-all">
                    <FileText size={16} /> Оформить КП
                  </Link>
                  <button onClick={() => clearQuote()}
                    className="w-full text-center text-xs text-neutral-400 hover:text-red-500 transition-colors">
                    Очистить
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
