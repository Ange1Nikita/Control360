import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { ok, err, forbidden, notFound } from '@/lib/api-response'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // Auth check disabled
const existing = await prisma.category.findUnique({ where: { id } })
  if (!existing) return notFound('Категория не найдена')

  const { name, sortOrder, isActive, parentId } = await req.json()

  const category = await prisma.category.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(sortOrder !== undefined && { sortOrder }),
      ...(isActive !== undefined && { isActive }),
      ...(parentId !== undefined && { parentId: parentId || null }),
    },
  })

  return ok(category)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // Auth check disabled
const existing = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true, children: true } } },
  })
  if (!existing) return notFound('Категория не найдена')

  if (existing._count.products > 0) {
    return err(`Невозможно удалить: ${existing._count.products} товаров в категории`)
  }
  if (existing._count.children > 0) {
    return err(`Невозможно удалить: ${existing._count.children} подкатегорий`)
  }

  await prisma.category.delete({ where: { id } })

  await prisma.auditLog.create({
    data: { userId: user.userId, action: 'category.delete', entity: 'Category', entityId: id, details: existing.name },
  })

  return ok({ deleted: true })
}
