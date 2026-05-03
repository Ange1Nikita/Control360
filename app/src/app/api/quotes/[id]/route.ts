import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { ok, forbidden, notFound } from '@/lib/api-response'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getAuthUser()
  if (!user) return forbidden('Не авторизован')

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, company: true, phone: true } },
      items: { include: { product: { select: { name: true, sku: true, images: { where: { isMain: true }, take: 1 } } } } },
    },
  })

  if (!quote) return notFound('КП не найдено')
  if (quote.userId !== user.userId && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
    return forbidden('Нет доступа')
  }

  return ok(quote)
}
