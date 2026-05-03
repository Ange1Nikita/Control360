import { prisma } from '@/lib/prisma'
import { ok } from '@/lib/api-response'

export async function GET() {
  const categories = await prisma.category.findMany({
    where: { isActive: true, parentId: null },
    include: {
      children: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: { _count: { select: { products: true } } },
      },
      _count: { select: { products: true } },
    },
    orderBy: { sortOrder: 'asc' },
  })

  // Only return categories that have products (directly or via children)
  const filtered = categories
    .map(cat => ({
      ...cat,
      children: cat.children.filter(child => child._count.products > 0),
    }))
    .filter(cat => cat._count.products > 0 || cat.children.length > 0)

  return ok(filtered)
}
