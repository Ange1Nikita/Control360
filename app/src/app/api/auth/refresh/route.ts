import { prisma } from '@/lib/prisma'
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from '@/lib/auth'
import { ok, unauthorized } from '@/lib/api-response'
import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refresh_token')?.value

  if (!refreshToken) return unauthorized()

  const payload = verifyRefreshToken(refreshToken)
  if (!payload) return unauthorized('Токен истёк, войдите заново')

  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!user || user.refreshToken !== refreshToken) return unauthorized()

  const newPayload = { userId: user.id, email: user.email, role: user.role, status: user.status }
  const newAccess = generateAccessToken(newPayload)
  const newRefresh = generateRefreshToken(newPayload)

  await prisma.user.update({ where: { id: user.id }, data: { refreshToken: newRefresh } })

  cookieStore.set('access_token', newAccess, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', maxAge: 15 * 60, path: '/',
  })
  cookieStore.set('refresh_token', newRefresh, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', maxAge: 7 * 24 * 60 * 60, path: '/',
  })

  return ok({ user: { id: user.id, email: user.email, name: user.name, role: user.role } })
}
