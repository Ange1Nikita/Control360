import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { ok, err, forbidden, notFound } from '@/lib/api-response'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // Auth check disabled
const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true, brand: true, images: { orderBy: { sortOrder: 'asc' } }, attributes: { orderBy: { sortOrder: 'asc' } }, prices: true, stock: true },
  })
  if (!product) return notFound('Товар не найден')
  return ok(product)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // Auth check disabled
const existing = await prisma.product.findUnique({ where: { id } })
  if (!existing) return notFound('Товар не найден')

  const body = await req.json()
  const { name, sku, model, description, passport, categoryId, brandId, isActive, isNew, metaTitle, metaDescription, attributes, images, prices, stockQty } = body

  // Update product fields
  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(sku !== undefined && { sku: sku || null }),
      ...(model !== undefined && { model: model || null }),
      ...(description !== undefined && { description: description || null }),
      ...(passport !== undefined && { passport: passport || null }),
      ...(categoryId !== undefined && { categoryId: categoryId || null }),
      ...(brandId !== undefined && { brandId: brandId || null }),
      ...(isActive !== undefined && { isActive }),
      ...(isNew !== undefined && { isNew }),
      ...(metaTitle !== undefined && { metaTitle: metaTitle || null }),
      ...(metaDescription !== undefined && { metaDescription: metaDescription || null }),
    },
  })

  // Replace attributes
  if (attributes !== undefined) {
    await prisma.productAttribute.deleteMany({ where: { productId: id } })
    if (attributes.length > 0) {
      await prisma.productAttribute.createMany({
        data: attributes.map((a: { name: string; value: string }, i: number) => ({
          productId: id, name: a.name, value: a.value, sortOrder: i,
        })),
      })
    }
  }

  // Replace images
  if (images !== undefined) {
    await prisma.productImage.deleteMany({ where: { productId: id } })
    if (images.length > 0) {
      await prisma.productImage.createMany({
        data: images.map((img: { url: string; alt?: string; isMain?: boolean }, i: number) => ({
          productId: id, url: img.url, alt: img.alt || null, isMain: img.isMain ?? i === 0, sortOrder: i,
        })),
      })
    }
  }

  // Upsert prices
  if (prices !== undefined) {
    await prisma.productPrice.upsert({
      where: { productId: id },
      create: {
        productId: id,
        rrp: prices.rrp ?? null,
        priceRetail: prices.priceRetail ?? null,
        priceDealer: prices.priceDealer ?? null,
        priceCash: prices.priceCash ?? null,
        pricePartner: prices.pricePartner ?? null,
        priceVip: prices.priceVip ?? null,
      },
      update: {
        rrp: prices.rrp ?? null,
        priceRetail: prices.priceRetail ?? null,
        priceDealer: prices.priceDealer ?? null,
        priceCash: prices.priceCash ?? null,
        pricePartner: prices.pricePartner ?? null,
        priceVip: prices.priceVip ?? null,
      },
    })
  }

  // Update stock
  if (stockQty !== undefined) {
    await prisma.stock.upsert({
      where: { productId_warehouse: { productId: id, warehouse: 'main' } },
      create: { productId: id, warehouse: 'main', quantity: stockQty },
      update: { quantity: stockQty },
    })
  }

  await prisma.auditLog.create({
    data: { userId: user.userId, action: 'product.update', entity: 'Product', entityId: id, details: name || existing.name },
  })

  const updated = await prisma.product.findUnique({
    where: { id },
    include: { category: true, brand: true, images: { orderBy: { sortOrder: 'asc' } }, attributes: { orderBy: { sortOrder: 'asc' } }, prices: true, stock: true },
  })

  return ok(updated)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // Auth check disabled
const existing = await prisma.product.findUnique({ where: { id } })
  if (!existing) return notFound('Товар не найден')

  // Delete related QuoteItems first (no cascade on this relation)
  await prisma.quoteItem.deleteMany({ where: { productId: id } })

  await prisma.product.delete({ where: { id } })

  await prisma.auditLog.create({
    data: { userId: user.userId, action: 'product.delete', entity: 'Product', entityId: id, details: existing.name },
  })

  return ok({ deleted: true })
}
