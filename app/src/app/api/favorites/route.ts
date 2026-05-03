import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { ok, err, unauthorized } from '@/lib/api-response'

export async function GET() {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.userId },
    include: {
      product: {
        include: {
          brand: { select: { name: true, slug: true } },
          images: { where: { isMain: true }, take: 1 },
          prices: true,
          stock: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return ok(favorites)
}

// POST — toggle favorite
export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return unauthorized()

  const { productId } = await req.json()
  if (!productId) return err('productId обязателен')

  const existing = await prisma.favorite.findUnique({
    where: { userId_productId: { userId: user.userId, productId } },
  })

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } })
    return ok({ favorited: false })
  }

  await prisma.favorite.create({
    data: { userId: user.userId, productId },
  })
  return ok({ favorited: true })
}
