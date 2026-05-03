import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { ok } from '@/lib/api-response'
import { cookies } from 'next/headers'

export async function POST() {
  const user = await getAuthUser()

  if (user) {
    await prisma.user.update({
      where: { id: user.userId },
      data: { refreshToken: null },
    })
  }

  const cookieStore = await cookies()
  cookieStore.delete('access_token')
  cookieStore.delete('refresh_token')

  return ok({ message: 'Выход выполнен' })
}
