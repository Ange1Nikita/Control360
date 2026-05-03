import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { ok, unauthorized } from '@/lib/api-response'

export async function GET() {
  const auth = await getAuthUser()
  if (!auth) return unauthorized()

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: {
      id: true, email: true, name: true, phone: true,
      company: true, inn: true, role: true, status: true,
      createdAt: true,
      _count: { select: { quotes: true, favorites: true } },
    },
  })

  if (!user) return unauthorized()

  return ok(user)
}
