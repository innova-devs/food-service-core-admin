/** Origen HTTP (host + puerto) para Socket.IO, sin path `/api`. */
export function getSocketBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API?.trim()
  if (!raw) {
    if (typeof window !== "undefined") return window.location.origin
    return ""
  }
  try {
    const normalized = raw.includes("://") ? raw : `http://${raw}`
    const u = new URL(normalized)
    return `${u.protocol}//${u.host}`
  } catch {
    return raw.replace(/\/$/, "").replace(/\/api$/, "")
  }
}
