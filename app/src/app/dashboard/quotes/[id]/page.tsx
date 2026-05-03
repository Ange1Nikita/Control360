'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FileText, Download, ArrowLeft, Loader2 } from 'lucide-react'
import { formatPrice, cn } from '@/lib/utils'

const statusConfig: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Черновик', color: 'bg-neutral-100 text-neutral-600' },
  SENT: { label: 'Отправлено', color: 'bg-blue-100 text-blue-700' },
  APPROVED: { label: 'Одобрено', color: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'Отклонено', color: 'bg-red-100 text-red-700' },
  EXPIRED: { label: 'Истекло', color: 'bg-orange-100 text-orange-700' },
}

export default function QuoteDetailPage() {
  const { id } = useParams()
  const [quote, setQuote] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/quotes/${id}`).then(r => r.ok ? r.json() : null).then(d => { setQuote(d); setLoading(false) }).catch(() => setLoading(false))
  }, [id])

  const downloadPDF = async () => {
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    const doc = new jsPDF()

    // Header
    doc.setFontSize(20)
    doc.setTextColor(55, 126, 250)
    doc.text('VidosGroup', 14, 20)
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text('Краснодар | +7 (918) 975-16-42 | info@vidosgroup.ru', 14, 27)

    // Quote info
    doc.setFontSize(14)
    doc.setTextColor(0)
    doc.text(`Коммерческое предложение ${quote.number}`, 14, 42)
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`Дата: ${new Date(quote.createdAt).toLocaleDateString('ru-RU')}`, 14, 50)

    // Client
    if (quote.clientName || quote.clientCompany) {
      doc.setTextColor(0)
      doc.setFontSize(11)
      doc.text('Клиент:', 14, 62)
      doc.setFontSize(10)
      doc.setTextColor(60)
      let y = 68
      if (quote.clientCompany) { doc.text(quote.clientCompany, 14, y); y += 5 }
      if (quote.clientName) { doc.text(quote.clientName, 14, y); y += 5 }
      if (quote.clientPhone) { doc.text(quote.clientPhone, 14, y); y += 5 }
      if (quote.clientEmail) { doc.text(quote.clientEmail, 14, y); y += 5 }
    }

    // Table
    const tableData = quote.items.map((item: any, i: number) => [
      i + 1,
      item.product?.name || '—',
      item.product?.sku || '—',
      item.quantity,
      item.price > 0 ? `${item.price.toLocaleString('ru-RU')} ₽` : '—',
      item.total > 0 ? `${item.total.toLocaleString('ru-RU')} ₽` : '—',
    ])

    autoTable(doc, {
      startY: 85,
      head: [['#', 'Наименование', 'Артикул', 'Кол-во', 'Цена', 'Сумма']],
      body: tableData,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [55, 126, 250] },
    })

    // Total
    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(12)
    doc.setTextColor(0)
    doc.text(`Итого: ${quote.total > 0 ? quote.total.toLocaleString('ru-RU') + ' ₽' : 'По запросу'}`, 14, finalY)

    if (quote.notes) {
      doc.setFontSize(9)
      doc.setTextColor(100)
      doc.text(`Примечание: ${quote.notes}`, 14, finalY + 8)
    }

    doc.save(`КП-${quote.number}.pdf`)
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin text-blue-600" size={28} /></div>
  if (!quote) return <div className="max-w-3xl mx-auto px-4 py-20 text-center"><h1 className="text-xl font-bold">КП не найдено</h1></div>

  const st = statusConfig[quote.status] || statusConfig.DRAFT

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/quotes" className="p-2 hover:bg-neutral-100 rounded-lg"><ArrowLeft size={20} /></Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {quote.number}
              <span className={cn('px-2.5 py-0.5 text-xs font-medium rounded-full', st.color)}>{st.label}</span>
            </h1>
            <p className="text-sm text-neutral-500">от {new Date(quote.createdAt).toLocaleDateString('ru-RU')}</p>
          </div>
        </div>
        <button onClick={downloadPDF}
          className="flex items-center gap-2 px-4 py-2 bg-[#377efa] text-white text-sm font-semibold rounded-xl hover:bg-[#2b6be6] transition-colors">
          <Download size={16} /> Скачать PDF
        </button>
      </div>

      {/* Client info */}
      {(quote.clientName || quote.clientCompany) && (
        <div className="bg-white rounded-xl border border-neutral-200 p-5 mb-6">
          <h3 className="font-semibold text-sm mb-2">Клиент</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {quote.clientName && <div><span className="text-neutral-400">ФИО:</span> {quote.clientName}</div>}
            {quote.clientCompany && <div><span className="text-neutral-400">Компания:</span> {quote.clientCompany}</div>}
            {quote.clientPhone && <div><span className="text-neutral-400">Телефон:</span> {quote.clientPhone}</div>}
            {quote.clientEmail && <div><span className="text-neutral-400">Email:</span> {quote.clientEmail}</div>}
          </div>
          {quote.notes && <div className="text-sm text-neutral-500 mt-2 pt-2 border-t border-neutral-100">{quote.notes}</div>}
        </div>
      )}

      {/* Items table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500">Товар</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500">Артикул</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-500">Кол-во</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-500">Цена</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-500">Сумма</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {quote.items.map((item: any) => (
              <tr key={item.id} className="hover:bg-neutral-50 transition-colors">
                <td className="px-4 py-3 font-medium">{item.product?.name || '—'}</td>
                <td className="px-4 py-3 text-neutral-500 font-mono text-xs">{item.product?.sku || '—'}</td>
                <td className="px-4 py-3 text-center">{item.quantity}</td>
                <td className="px-4 py-3 text-right">{item.price > 0 ? formatPrice(item.price) : '—'}</td>
                <td className="px-4 py-3 text-right font-medium">{item.total > 0 ? formatPrice(item.total) : '—'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-neutral-50">
            <tr>
              <td colSpan={4} className="px-4 py-3 text-right font-semibold">Итого:</td>
              <td className="px-4 py-3 text-right text-lg font-bold">{quote.total > 0 ? formatPrice(quote.total) : 'По запросу'}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
