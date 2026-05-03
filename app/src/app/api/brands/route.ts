import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api-response'

export async function GET() {
  const brands = await prisma.brand.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true, logo: true, _count: { select: { products: true } } },
    orderBy: { sortOrder: 'asc' },
  })

  // Only return brands that have products
  const filtered = brands.filter(b => b._count.products > 0)

  return ok(filtered)
}
