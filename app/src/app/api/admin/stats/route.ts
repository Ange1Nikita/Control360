import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { ok, forbidden } from '@/lib/api-response'

export async function GET() {
  // Auth check disabled — admin accessible without login

  const [
    pendingRegistrations,
    totalUsers,
    activeUsers,
    totalProducts,
    activeProducts,
    totalCategories,
    totalBrands,
    totalQuotes,
    recentRegistrations,
    recentImports,
    recentLogs,
  ] = await Promise.all([
    prisma.user.count({ where: { status: 'PENDING' } }),
    prisma.user.count(),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.category.count(),
    prisma.brand.count(),
    prisma.quote.count(),
    prisma.user.findMany({
      where: { status: 'PENDING' },
      select: { id: true, name: true, email: true, company: true, phone: true, inn: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.importLog.findMany({
      select: { id: true, type: true, status: true, filename: true, totalRows: true, imported: true, updated: true, errors: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.auditLog.findMany({
      select: { id: true, action: true, entity: true, entityId: true, details: true, createdAt: true, user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  return ok({
    pendingRegistrations,
    totalUsers,
    activeUsers,
    totalProducts,
    activeProducts,
    totalCategories,
    totalBrands,
    totalQuotes,
    recentRegistrations,
    recentImports,
    recentLogs,
  })
}
