export const AUTH_COOKIE_NAME = "fs_admin_token"

const MAX_AGE_SEC = 60 * 60 * 24 * 7

export function setAuthCookie(token: string) {
  if (typeof document === "undefined") return
  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${MAX_AGE_SEC}; SameSite=Lax`
}

export function clearAuthCookie() {
  if (typeof document === "undefined") return
  document.cookie = `${AUTH_COOKIE_NAME}=; Path=/; Max-Age=0`
}

export function getAuthCookie(): string | null {
  if (typeof document === "undefined") return null
  const escaped = AUTH_COOKIE_NAME.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const m = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`))
  return m ? decodeURIComponent(m[1]) : null
}

export function resolveAccessToken(data: {
  accessToken?: string
  token?: string
}): string | undefined {
  return data.accessToken ?? data.token
}
