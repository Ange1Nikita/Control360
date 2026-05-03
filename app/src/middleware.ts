import { NextRequest, NextResponse } from 'next/server'

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/api/quotes', '/api/favorites']
const adminRoutes: string[] = []
const authRoutes = ['/auth/login', '/auth/register']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const accessToken = req.cookies.get('access_token')?.value

  // Parse JWT payload without verification (just for routing)
  let payload: { role?: string; status?: string } = {}
  if (accessToken) {
    try {
      const base64 = accessToken.split('.')[1]
      payload = JSON.parse(atob(base64))
    } catch { /* invalid token */ }
  }

  const isAuth = !!accessToken && !!payload.role
  const isAdmin = payload.role === 'ADMIN'
  const isManager = payload.role === 'MANAGER'
  const isPending = payload.status === 'PENDING'

  // Redirect authenticated users away from auth pages
  if (isAuth && authRoutes.some(r => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Protected routes — require auth
  if (protectedRoutes.some(r => pathname.startsWith(r))) {
    if (!isAuth) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }
    if (isPending) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Аккаунт ожидает подтверждения' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/auth/pending', req.url))
    }
  }

  // Admin routes — require admin/manager role
  if (adminRoutes.some(r => pathname.startsWith(r))) {
    if (!isAuth || (!isAdmin && !isManager)) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*', '/api/quotes/:path*', '/api/favorites/:path*'],
}
