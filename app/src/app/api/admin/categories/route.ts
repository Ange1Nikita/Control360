import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { ok, err, forbidden } from '@/lib/api-response'
import { slugify } from '@/lib/utils'

export async function GET() {
  // Auth check disabled
const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } }, children: { include: { _count: { select: { products: true } } } } },
    where: { parentId: null },
    orderBy: { sortOrder: 'asc' },
  })

  return ok(categories)
}

export async function POST(req: Request) {
  // Auth check disabled
const { name, parentId, sortOrder, isActive } = await req.json()
  if (!name) return err('Название обязательно')

  let slug = slugify(name)
  const existing = await prisma.category.findUnique({ where: { slug } })
  if (existing) slug = `${slug}-${Date.now()}`

  const category = await prisma.category.create({
    data: { name, slug, parentId: parentId || null, sortOrder: sortOrder ?? 0, isActive: isActive ?? true },
  })

  await prisma.auditLog.create({
    data: { userId: user.userId, action: 'category.create', entity: 'Category', entityId: category.id, details: name },
  })

  return ok(category, 201)
}
