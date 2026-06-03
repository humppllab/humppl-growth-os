import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const session = request.cookies.get('humppl_session')?.value
  const { pathname } = request.nextUrl

  // Public paths
  const isLoginPage = pathname === '/login'

  if (!session && !isLoginPage) {
    // Redirect unauthenticated user to login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (session && isLoginPage) {
    // Redirect authenticated user away from login
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

// Protect all routes except static assets and favicon
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\..*$).*)'
  ]
}
