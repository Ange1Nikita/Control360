import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api-response'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() || ''
  if (q.length < 1) return ok({ products: [], categories: [], brands: [] })

  const [products, categories, brands] = await Promise.all([
    prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q } },
          { sku: { contains: q } },
          { model: { contains: q } },
        ],
      },
      select: {
        id: true, name: true, slug: true, sku: true,
        brand: { select: { name: true } },
        category: { select: { name: true } },
        images: { where: { isMain: true }, take: 1, select: { url: true } },
      },
      take: 6,
    }),
    prisma.category.findMany({
      where: { isActive: true, name: { contains: q }, products: { some: {} } },
      select: { id: true, name: true, slug: true, _count: { select: { products: true } } },
      take: 3,
    }),
    prisma.brand.findMany({
      where: { isActive: true, name: { contains: q }, products: { some: {} } },
      select: { id: true, name: true, slug: true, _count: { select: { products: true } } },
      take: 3,
    }),
  ])

  return ok({
    products: products.map(p => ({ ...p, image: p.images[0]?.url || null })),
    categories: categories.map(c => ({ ...c, count: c._count.products })),
    brands: brands.map(b => ({ ...b, count: b._count.products })),
  })
}
