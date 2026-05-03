'use client'

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface QuoteItem {
  name: string
  sku: string
  quantity: number
  price: number
  total: number
}

interface QuoteData {
  number: string
  date: string
  validUntil: string
  clientName: string
  clientCompany: string
  clientPhone: string
  clientEmail: string
  items: QuoteItem[]
  subtotal: number
  discount: number
  total: number
  notes: string
}

export function generateQuotePDF(data: QuoteData): jsPDF {
  const doc = new jsPDF()

  // Header
  doc.setFillColor(26, 26, 26)
  doc.rect(0, 0, 210, 35, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.text('КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ', 15, 18)

  doc.setFontSize(10)
  doc.text(`${data.number} от ${data.date}`, 15, 28)
  doc.text(`Действительно до: ${data.validUntil}`, 120, 28)

  // Company info
  doc.setTextColor(50, 50, 50)
  doc.setFontSize(9)
  let y = 45

  doc.setFontSize(11)
  doc.setFont(undefined!, 'bold')
  doc.text('VidosGroup Краснодар', 15, y)
  doc.setFont(undefined!, 'normal')
  doc.setFontSize(9)
  y += 6
  doc.text('г. Краснодар, ул. Боспорская, 10', 15, y)
  y += 5
  doc.text('Тел: +7 (918) 975-16-42', 15, y)
  y += 5
  doc.text('Email: info@vidosgroup-krd.ru', 15, y)

  // Client info
  y = 45
  doc.setFontSize(11)
  doc.setFont(undefined!, 'bold')
  doc.text('Заказчик:', 120, y)
  doc.setFont(undefined!, 'normal')
  doc.setFontSize(9)
  y += 6
  if (data.clientCompany) { doc.text(data.clientCompany, 120, y); y += 5 }
  if (data.clientName) { doc.text(data.clientName, 120, y); y += 5 }
  if (data.clientPhone) { doc.text(`Тел: ${data.clientPhone}`, 120, y); y += 5 }
  if (data.clientEmail) { doc.text(`Email: ${data.clientEmail}`, 120, y); y += 5 }

  // Divider
  y = 78
  doc.setDrawColor(200, 200, 200)
  doc.line(15, y, 195, y)

  // Table
  y += 5
  const tableData = data.items.map((item, i) => [
    String(i + 1),
    item.name,
    item.sku || '—',
    String(item.quantity),
    formatNum(item.price),
    formatNum(item.total),
  ])

  autoTable(doc, {
    startY: y,
    head: [['#', 'Наименование', 'Артикул', 'Кол-во', 'Цена', 'Сумма']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 70 },
      2: { cellWidth: 30 },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 30, halign: 'right' },
    },
    margin: { left: 15, right: 15 },
  })

  // Totals
  const finalY = (doc as any).lastAutoTable.finalY + 8

  doc.setFontSize(9)
  doc.text('Итого:', 140, finalY)
  doc.setFont(undefined!, 'bold')
  doc.setFontSize(12)
  doc.text(formatNum(data.total) + ' руб.', 165, finalY, { align: 'right' })

  if (data.discount > 0) {
    doc.setFont(undefined!, 'normal')
    doc.setFontSize(9)
    doc.setTextColor(150, 150, 150)
    doc.text(`Скидка: ${formatNum(data.discount)} руб.`, 140, finalY + 6)
  }

  // Notes
  if (data.notes) {
    doc.setTextColor(100, 100, 100)
    doc.setFontSize(8)
    doc.text('Примечание: ' + data.notes, 15, finalY + 15, { maxWidth: 180 })
  }

  // Footer
  const pageH = doc.internal.pageSize.height
  doc.setDrawColor(200, 200, 200)
  doc.line(15, pageH - 25, 195, pageH - 25)

  doc.setTextColor(150, 150, 150)
  doc.setFontSize(7)
  doc.text('VidosGroup Краснодар · Системы видеонаблюдения и безопасности', 105, pageH - 18, { align: 'center' })
  doc.text(`Документ сформирован ${new Date().toLocaleDateString('ru-RU')}`, 105, pageH - 13, { align: 'center' })

  return doc
}

function formatNum(n: number): string {
  return new Intl.NumberFormat('ru-RU').format(Math.round(n))
}
