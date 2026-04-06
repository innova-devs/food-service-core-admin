import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { AUTH_COOKIE_NAME, getUserRoleFromToken } from "@/lib/auth"
import { canAccessPath, defaultPathForRole } from "@/lib/access-control"

const LOGIN_PATH = "/login"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/api")) {
    return NextResponse.next()
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value

  if (pathname === LOGIN_PATH || pathname.startsWith(`${LOGIN_PATH}/`)) {
    if (token) {
      return NextResponse.redirect(new URL("/", request.url))
    }
    return NextResponse.next()
  }

  if (!token) {
    const loginUrl = new URL(LOGIN_PATH, request.url)
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  const role = getUserRoleFromToken(token)
  if (!canAccessPath(role, pathname)) {
    return NextResponse.redirect(new URL(defaultPathForRole(role), request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api/|_next/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
