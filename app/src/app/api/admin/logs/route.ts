import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { ok, forbidden } from '@/lib/api-response'

export async function GET(req: Request) {
  // Auth check disabled
const url = new URL(req.url)
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
  const limit = Math.min(100, parseInt(url.searchParams.get('limit') || '50'))
  const action = url.searchParams.get('action') || undefined
  const entity = url.searchParams.get('entity') || undefined

  const where: any = {}
  if (action) where.action = { contains: action }
  if (entity) where.entity = entity

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ])

  return ok({ items, total, page, pages: Math.ceil(total / limit) })
}
