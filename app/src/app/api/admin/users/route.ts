import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { ok, err, unauthorized, forbidden } from '@/lib/api-response'

// GET — список пользователей
export async function GET(req: NextRequest) {
  // Auth check disabled

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || ''

  const where: Record<string, unknown> = {}
  if (status) where.status = status

  const users = await prisma.user.findMany({
    where: where as never,
    select: {
      id: true, email: true, name: true, phone: true,
      company: true, inn: true, role: true, status: true,
      createdAt: true,
      _count: { select: { quotes: true } }
    },
    orderBy: { createdAt: 'desc' },
  })

  return ok(users)
}

// PATCH — обновить пользователя (approve/block)
export async function PATCH(req: NextRequest) {
  const admin = await getAuthUser()
  if (!admin) return unauthorized()
  if (admin.role !== 'ADMIN') return forbidden()

  const { userId, status, role } = await req.json()
  if (!userId) return err('userId обязателен')

  const data: Record<string, unknown> = {}
  if (status) data.status = status
  if (role) data.role = role

  const updated = await prisma.user.update({
    where: { id: userId },
    data: data as never,
    select: { id: true, email: true, name: true, status: true, role: true },
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: admin.userId,
      action: status === 'ACTIVE' ? 'user.approve' : 'user.update',
      entity: 'User',
      entityId: userId,
      details: JSON.stringify(data),
    },
  })

  return ok(updated)
}
