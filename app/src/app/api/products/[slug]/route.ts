import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, notFound } from '@/lib/api-response'

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      brand: { select: { id: true, name: true, slug: true } },
      images: { orderBy: { sortOrder: 'asc' } },
      attributes: { orderBy: { sortOrder: 'asc' } },
      documents: { orderBy: { sortOrder: 'asc' } },
      prices: true,
      stock: true,
    },
  })

  if (!product) return notFound('Товар не найден')

  return ok(product)
}
