import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { ok, forbidden } from '@/lib/api-response'

export async function GET(req: Request) {
  // Auth check disabled
const url = new URL(req.url)
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
  const limit = Math.min(50, parseInt(url.searchParams.get('limit') || '25'))
  const status = url.searchParams.get('status') || undefined

  const where: any = {}
  if (status) where.status = status

  const [items, total] = await Promise.all([
    prisma.quote.findMany({
      where,
      include: {
        user: { select: { name: true, email: true, company: true } },
        items: { include: { product: { select: { name: true, sku: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.quote.count({ where }),
  ])

  return ok({ items, total, page, pages: Math.ceil(total / limit) })
}

export async function PATCH(req: Request) {
  // Auth check disabled
const { quoteId, status } = await req.json()

  const quote = await prisma.quote.update({
    where: { id: quoteId },
    data: { status },
  })

  await prisma.auditLog.create({
    data: { userId: user.userId, action: 'quote.update', entity: 'Quote', entityId: quoteId, details: `Статус → ${status}` },
  })

  return ok(quote)
}
