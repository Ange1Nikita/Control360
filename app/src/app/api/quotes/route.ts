import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { ok, err, unauthorized } from '@/lib/api-response'

// GET — список КП пользователя
export async function GET() {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const quotes = await prisma.quote.findMany({
    where: { userId: user.userId },
    include: {
      items: {
        include: {
          product: {
            select: { name: true, sku: true, images: { where: { isMain: true }, take: 1 } }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
  })

  return ok(quotes)
}

// POST — создать КП
export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const body = await req.json()
  const { items, clientName, clientCompany, clientPhone, clientEmail, notes } = body

  if (!items || !Array.isArray(items) || items.length === 0) {
    return err('Добавьте хотя бы один товар в КП')
  }

  // Генерируем номер КП
  const year = new Date().getFullYear()
  const count = await prisma.quote.count({ where: { createdAt: { gte: new Date(`${year}-01-01`) } } })
  const number = `КП-${year}-${String(count + 1).padStart(4, '0')}`

  // Получаем цены товаров
  const productIds = items.map((i: { productId: string }) => i.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { prices: true },
  })

  const quoteItems = items.map((item: { productId: string; quantity: number }) => {
    const product = products.find(p => p.id === item.productId)
    const pp = product?.prices?.[0]
    const price = pp?.priceDealer || pp?.priceRetail || pp?.rrp || 0
    return {
      productId: item.productId,
      quantity: item.quantity || 1,
      price,
      total: price * (item.quantity || 1),
    }
  })

  const subtotal = quoteItems.reduce((sum: number, i: { total: number }) => sum + i.total, 0)

  const quote = await prisma.quote.create({
    data: {
      number,
      userId: user.userId,
      clientName: clientName || null,
      clientCompany: clientCompany || null,
      clientPhone: clientPhone || null,
      clientEmail: clientEmail || null,
      notes: notes || null,
      subtotal,
      total: subtotal,
      validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 дней
      items: { create: quoteItems },
    },
    include: { items: { include: { product: { select: { name: true, sku: true } } } } },
  })

  return ok(quote, 201)
}
