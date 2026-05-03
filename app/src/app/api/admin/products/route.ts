import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { ok, err, forbidden } from '@/lib/api-response'
import { slugify } from '@/lib/utils'

export async function GET(req: NextRequest) {
  // Auth check disabled
const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, parseInt(searchParams.get('limit') || '50'))
  const brandId = searchParams.get('brandId') || ''
  const search = searchParams.get('q') || ''

  const where: Record<string, unknown> = {}

  if (brandId === '__none__') {
    where.brandId = null
  } else if (brandId) {
    where.brandId = brandId
  }

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { sku: { contains: search } },
      { model: { contains: search } },
    ]
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: where as never,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { sortOrder: 'asc' as const } },
        prices: true,
      },
      orderBy: { name: 'asc' as const },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where: where as never }),
  ])

  return ok({ items: products, total, page, pages: Math.ceil(total / limit) })
}

export async function POST(req: Request) {
  // Auth check disabled
const body = await req.json()
  const { name, sku, model, description, passport, categoryId, brandId, isActive, isNew, metaTitle, metaDescription, attributes, images, prices, stockQty } = body

  if (!name) return err('Название обязательно')

  let slug = slugify(name)
  const existing = await prisma.product.findUnique({ where: { slug } })
  if (existing) slug = `${slug}-${Date.now()}`

  const product = await prisma.product.create({
    data: {
      name,
      slug,
      sku: sku || null,
      passport: passport || null,
      model: model || null,
      description: description || null,
      categoryId: categoryId || null,
      brandId: brandId || null,
      isActive: isActive ?? true,
      isNew: isNew ?? false,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      attributes: attributes?.length ? {
        create: attributes.map((a: { name: string; value: string }, i: number) => ({
          name: a.name, value: a.value, sortOrder: i,
        })),
      } : undefined,
      images: images?.length ? {
        create: images.map((img: { url: string; alt?: string; isMain?: boolean }, i: number) => ({
          url: img.url, alt: img.alt || null, isMain: img.isMain ?? i === 0, sortOrder: i,
        })),
      } : undefined,
      prices: prices ? {
        create: {
          rrp: prices.rrp ?? null,
          priceRetail: prices.priceRetail ?? null,
          priceDealer: prices.priceDealer ?? null,
          priceCash: prices.priceCash ?? null,
          pricePartner: prices.pricePartner ?? null,
          priceVip: prices.priceVip ?? null,
        },
      } : undefined,
      stock: stockQty != null ? {
        create: { warehouse: 'main', quantity: stockQty },
      } : undefined,
    },
    include: { category: true, brand: true, images: true, attributes: true, prices: true, stock: true },
  })

  await prisma.auditLog.create({
    data: { userId: user.userId, action: 'product.create', entity: 'Product', entityId: product.id, details: name },
  })

  return ok(product, 201)
}
