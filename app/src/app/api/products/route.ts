import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, err } from '@/lib/api-response'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'))
  const search = searchParams.get('q') || ''
  const categorySlug = searchParams.get('category') || ''
  const brandSlug = searchParams.get('brand') || ''
  const sort = searchParams.get('sort') || 'name'

  const where: Record<string, unknown> = { isActive: true }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { model: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (categorySlug) {
    // Check if this is a parent category (has children) — include products from all subcategories
    const cat = await prisma.category.findUnique({
      where: { slug: categorySlug },
      include: { children: { select: { id: true } } },
    })
    if (cat && cat.children.length > 0) {
      where.categoryId = { in: [cat.id, ...cat.children.map(c => c.id)] }
    } else {
      where.category = { slug: categorySlug }
    }
  }

  if (brandSlug) {
    where.brand = { slug: brandSlug }
  }

  const orderBy: Record<string, string> = {}
  if (sort === 'name') orderBy.name = 'asc'
  else if (sort === 'new') orderBy.createdAt = 'desc'
  else orderBy.name = 'asc'

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: where as never,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { sortOrder: 'asc' as const } },
        prices: true,
        stock: true,
      },
      orderBy: orderBy as never,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where: where as never }),
  ])

  return ok({
    items: products,
    total,
    page,
    pages: Math.ceil(total / limit),
  })
}
