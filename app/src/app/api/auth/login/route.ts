import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateAccessToken, generateRefreshToken } from '@/lib/auth'
import { ok, err, unauthorized } from '@/lib/api-response'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  if (!email || !password) {
    return err('Введите email и пароль')
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return unauthorized('Неверный email или пароль')
  }

  if (user.status === 'PENDING') {
    return err('Ваш аккаунт ожидает подтверждения администратором', 403)
  }

  if (user.status === 'BLOCKED') {
    return err('Ваш аккаунт заблокирован', 403)
  }

  const payload = { userId: user.id, email: user.email, role: user.role, status: user.status }
  const accessToken = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  })

  const cookieStore = await cookies()
  cookieStore.set('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60,
    path: '/',
  })
  cookieStore.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  })

  return ok({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      company: user.company,
    },
  })
}
