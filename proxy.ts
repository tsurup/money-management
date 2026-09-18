import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySession } from '@/lib/auth'

// 認証が必要なパス
const PROTECTED_PATHS = ['/', '/actions', '/logs', '/calendar', '/settings']
// 未認証時のみアクセスできるパス
const AUTH_PATHS = ['/login', '/signup']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('session')?.value
  const session = token ? await verifySession(token) : null

  const isProtected = PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )
  const isAuthPath = AUTH_PATHS.includes(pathname)

  if (isProtected && !session) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  if (isAuthPath && session) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
