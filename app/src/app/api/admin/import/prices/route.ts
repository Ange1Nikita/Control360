import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { ok, err, forbidden } from '@/lib/api-response'

export async function GET() {
  // Auth check disabled
const prices = await prisma.productPrice.findMany({
    select: { source: true, updatedAt: true },
  })

  const grouped: Record<string, { count: number; updatedAt: string }> = {}
  for (const p of prices) {
    const key = p.source || 'unknown'
    if (!grouped[key]) {
      grouped[key] = { count: 0, updatedAt: p.updatedAt.toISOString() }
    }
    grouped[key].count++
    if (p.updatedAt.toISOString() > grouped[key].updatedAt) {
      grouped[key].updatedAt = p.updatedAt.toISOString()
    }
  }

  const list = Object.entries(grouped).map(([source, data]) => ({
    source,
    count: data.count,
    updatedAt: data.updatedAt,
  }))

  list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  return ok({ priceLists: list, total: prices.length })
}

export async function DELETE(req: Request) {
  // Auth check disabled
const { source } = await req.json()
  if (!source) return err('Не указан источник прайса')

  const deleted = await prisma.productPrice.deleteMany({
    where: { source },
  })

  await prisma.auditLog.create({
    data: {
      userId: user.userId,
      action: 'prices.delete',
      entity: 'ProductPrice',
      details: `Удалён прайс "${source}": ${deleted.count} записей`,
    },
  })

  return ok({ deleted: deleted.count, source })
}

export async function POST(req: Request) {
  // Auth check disabled
const { items, filename } = await req.json()
  if (!items || !Array.isArray(items) || items.length === 0) {
    return err('Пустой список товаров')
  }

  const log = await prisma.importLog.create({
    data: { type: 'PRICES', status: 'PROCESSING', filename: filename || 'price-import.csv', totalRows: items.length },
  })

  let imported = 0
  let errors = 0
  const unmatchedList: string[] = []

  for (const item of items) {
    try {
      let product = null

      // Match by SKU (exact)
      if (item.sku) {
        product = await prisma.product.findFirst({ where: { sku: item.sku } })
      }
      // Match by model (exact)
      if (!product && item.model) {
        product = await prisma.product.findFirst({ where: { model: item.model } })
      }
      // SQLite is case-insensitive by default for ASCII, try contains as fallback
      if (!product && item.sku) {
        product = await prisma.product.findFirst({
          where: { sku: { contains: item.sku } },
        })
      }
      if (!product && item.model) {
        product = await prisma.product.findFirst({
          where: { model: { contains: item.model } },
        })
      }

      if (!product) {
        errors++
        unmatchedList.push(item.sku || item.model || `row-${errors}`)
        continue
      }

      const priceData: Record<string, any> = {}
      if (item.rrp != null) priceData.rrp = parseFloat(item.rrp)
      if (item.priceRetail != null) priceData.priceRetail = parseFloat(item.priceRetail)
      if (item.priceDealer != null) priceData.priceDealer = parseFloat(item.priceDealer)
      if (item.priceCash != null) priceData.priceCash = parseFloat(item.priceCash)
      if (item.pricePartner != null) priceData.pricePartner = parseFloat(item.pricePartner)
      if (item.priceVip != null) priceData.priceVip = parseFloat(item.priceVip)

      if (Object.keys(priceData).length > 0) {
        await prisma.productPrice.upsert({
          where: { productId: product.id },
          create: { productId: product.id, ...priceData, source: filename || 'csv-import' },
          update: { ...priceData, source: filename || 'csv-import' },
        })
        imported++
      } else {
        errors++
      }
    } catch {
      errors++
    }
  }

  await prisma.importLog.update({
    where: { id: log.id },
    data: { status: 'COMPLETED', imported, updated: 0, errors, unmatched: unmatchedList.length, details: unmatchedList.length > 0 ? unmatchedList.slice(0, 50).join(', ') : undefined },
  })

  await prisma.auditLog.create({
    data: { userId: user.userId, action: 'import.prices', entity: 'ImportLog', entityId: log.id, details: `${imported} обновлено, ${errors} ошибок` },
  })

  return ok({ imported, errors, unmatched: unmatchedList })
}
