import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { ok, err, forbidden } from '@/lib/api-response'

export async function GET() {
  // Auth check disabled
const brands = await prisma.brand.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      _count: { select: { products: true } },
    },
    orderBy: { name: 'asc' },
  })

  // Products without a brand
  const noBrandCount = await prisma.product.count({ where: { brandId: null } })

  const items = brands
    .filter(b => b._count.products > 0)
    .map(b => ({
      brandId: b.id,
      brandName: b.name,
      brandSlug: b.slug,
      count: b._count.products,
    }))

  if (noBrandCount > 0) {
    items.push({
      brandId: '__none__',
      brandName: 'Без бренда',
      brandSlug: '',
      count: noBrandCount,
    })
  }

  const total = await prisma.product.count()

  return ok({ items, total })
}

export async function DELETE(req: Request) {
  // Auth check disabled
const { brandId } = await req.json()
  if (!brandId) return err('Не указан бренд')

  const where = brandId === '__none__' ? { brandId: null } : { brandId }

  const products = await prisma.product.findMany({
    where: where as never,
    select: { id: true },
  })

  if (products.length === 0) return ok({ deleted: 0 })

  const ids = products.map(p => p.id)

  // Delete related QuoteItems first (no cascade on this relation)
  await prisma.quoteItem.deleteMany({
    where: { productId: { in: ids } },
  })

  await prisma.product.deleteMany({
    where: { id: { in: ids } },
  })

  await prisma.auditLog.create({
    data: {
      userId: user.userId,
      action: 'products.batch_delete',
      entity: 'Product',
      details: `Удалено ${ids.length} товаров (бренд: ${brandId === '__none__' ? 'без бренда' : brandId})`,
    },
  })

  return ok({ deleted: ids.length })
}
