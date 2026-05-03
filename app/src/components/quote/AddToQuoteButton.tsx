'use client'

import { useState } from 'react'
import { FileText, Check } from 'lucide-react'
import { addToQuote, isInQuote } from '@/lib/quote-store'
import { cn } from '@/lib/utils'

interface Props {
  product: { id: string; name: string; sku: string; image: string; price: number }
  variant?: 'full' | 'icon'
}

export default function AddToQuoteButton({ product, variant = 'full' }: Props) {
  const [added, setAdded] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addToQuote({ productId: product.id, name: product.name, sku: product.sku, image: product.image, price: product.price })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  if (variant === 'icon') {
    return (
      <button onClick={handleClick} title="В КП"
        className={cn('p-2 rounded-xl transition-all', added ? 'bg-green-50 text-green-600' : 'text-neutral-400 hover:text-[#377efa] hover:bg-blue-50')}>
        {added ? <Check size={18} /> : <FileText size={18} />}
      </button>
    )
  }

  return (
    <button onClick={handleClick}
      className={cn('flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200',
        added
          ? 'bg-green-500 text-white shadow-[0_2px_12px_rgba(34,197,94,0.3)]'
          : 'bg-gradient-to-r from-[#377efa] to-[#5b8cff] text-white shadow-[0_2px_12px_rgba(55,126,250,0.3)] hover:shadow-[0_4px_20px_rgba(55,126,250,0.4)] hover:translate-y-[-1px]'
      )}>
      {added ? <><Check size={16} /> Добавлено в КП</> : <><FileText size={16} /> В коммерческое предложение</>}
    </button>
  )
}
