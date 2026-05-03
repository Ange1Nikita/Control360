import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { ok, err } from '@/lib/api-response'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { email, password, name, phone, company, inn } = body

  if (!email || !password || !name) {
    return err('Заполните обязательные поля: email, пароль, имя')
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return err('Пользователь с таким email уже существует')
  }

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: hashPassword(password),
      name,
      phone: phone || null,
      company: company || null,
      inn: inn || null,
      role: 'CLIENT',
      status: 'PENDING',
    },
  })

  return ok({
    message: 'Регистрация отправлена на рассмотрение. Ожидайте подтверждения администратора.',
    userId: user.id,
  }, 201)
}
