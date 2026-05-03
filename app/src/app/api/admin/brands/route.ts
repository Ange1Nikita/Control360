import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { ok, err, forbidden } from '@/lib/api-response'
import { slugify } from '@/lib/utils'

export async function GET() {
  // Auth check disabled
const brands = await prisma.brand.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { sortOrder: 'asc' },
  })

  return ok(brands)
}

export async function POST(req: Request) {
  // Auth check disabled
const { name, description, isActive } = await req.json()
  if (!name) return err('Название обязательно')

  let slug = name.toLowerCase().replace(/\s+/g, '-')
  const existing = await prisma.brand.findUnique({ where: { slug } })
  if (existing) slug = `${slug}-${Date.now()}`

  const brand = await prisma.brand.create({
    data: { name, slug, description: description || null, isActive: isActive ?? true },
  })

  await prisma.auditLog.create({
    data: { userId: user.userId, action: 'brand.create', entity: 'Brand', entityId: brand.id, details: name },
  })

  return ok(brand, 201)
}
