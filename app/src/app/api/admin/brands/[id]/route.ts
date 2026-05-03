import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { ok, err, forbidden, notFound } from '@/lib/api-response'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // Auth check disabled
const existing = await prisma.brand.findUnique({ where: { id } })
  if (!existing) return notFound('Бренд не найден')

  const { name, description, isActive, sortOrder } = await req.json()

  const brand = await prisma.brand.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description: description || null }),
      ...(isActive !== undefined && { isActive }),
      ...(sortOrder !== undefined && { sortOrder }),
    },
  })

  return ok(brand)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // Auth check disabled
const existing = await prisma.brand.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  })
  if (!existing) return notFound('Бренд не найден')

  if (existing._count.products > 0) {
    return err(`Невозможно удалить: ${existing._count.products} товаров привязано к бренду`)
  }

  await prisma.brand.delete({ where: { id } })

  await prisma.auditLog.create({
    data: { userId: user.userId, action: 'brand.delete', entity: 'Brand', entityId: id, details: existing.name },
  })

  return ok({ deleted: true })
}
