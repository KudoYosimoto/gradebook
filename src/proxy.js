import { NextResponse } from 'next/server'
import { COOKIE_NAME, readSession } from '@/lib/crypto'

const CABINET = ['/home', '/students', '/groups', '/disciplines', '/teachers', '/assignments', '/grades', '/reports', '/me', '/users', '/audit']

export function proxy(request) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/api/')) {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      const origin = request.headers.get('origin')
      if (origin && origin !== request.nextUrl.origin) {
        return NextResponse.json({ error: 'Запрос с чужого сайта отклонён' }, { status: 403 })
      }
    }
    return NextResponse.next()
  }

  if (CABINET.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const uid = readSession(request.cookies.get(COOKIE_NAME)?.value)
    if (!uid) return NextResponse.redirect(new URL('/login', request.url))
  }
  return NextResponse.next()
}

export const config = {
  // Не трогаем статические файлы Next.js (скрипты, стили, картинки).
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
