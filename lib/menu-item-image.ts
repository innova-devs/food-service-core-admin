/**
 * Resuelve la URL visible de la imagen de un platillo.
 * Prioriza `NEXT_PUBLIC_R2_PUBLIC_URL` + `imageKey` porque `image`/`imageUrl`
 * puede venir del endpoint S3 de R2 (no público) y romper el <img>.
 */
export function resolveMenuItemImageUrl(input: {
  imageUrl?: string | null
  imageKey?: string | null
}): string | null {
  const key = input.imageKey?.replace(/^\/+/, "").trim() || null
  const publicBase = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "")
    .trim()
    .replace(/\/+$/, "")

  if (key && publicBase) {
    return `${publicBase}/${key}`
  }

  return input.imageUrl?.trim() || null
}
