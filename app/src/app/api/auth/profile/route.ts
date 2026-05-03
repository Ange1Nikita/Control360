import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { ok, err, forbidden } from '@/lib/api-response'

export async function PUT(req: Request) {
  const user = await getAuthUser()
  if (!user) return forbidden('Не авторизован')

  const { name, phone, company, inn } = await req.json()

  const updated = await prisma.user.update({
    where: { id: user.userId },
    data: {
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone: phone || null }),
      ...(company !== undefined && { company: company || null }),
      ...(inn !== undefined && { inn: inn || null }),
    },
    select: { id: true, name: true, email: true, phone: true, company: true, inn: true, role: true },
  })

  return ok(updated)
}
