import { api } from "@/lib/api"
import type { BusinessWithSubscription } from "@/components/super-admin/types"

/** Relativo a `NEXT_PUBLIC_API` (p. ej. `http://host/api` → `/super-admin/businesses`). */
export const SUPER_ADMIN_BUSINESSES_PATH = "/super-admin/businesses"

export interface FetchSuperAdminBusinessesParams {
  offset?: number
  limit?: number
  /** Filtro por nombre (contiene, case-insensitive). */
  q?: string
}

export interface SuperAdminBusinessesListResponse {
  items: BusinessWithSubscription[]
  total: number
}

export async function fetchSuperAdminBusinesses(
  params: FetchSuperAdminBusinessesParams = {},
): Promise<SuperAdminBusinessesListResponse> {
  const offset = Math.max(0, params.offset ?? 0)
  const limit = Math.min(500, Math.max(1, params.limit ?? 100))
  const { data } = await api.get<SuperAdminBusinessesListResponse>(
    SUPER_ADMIN_BUSINESSES_PATH,
    {
      params: {
        offset,
        limit,
        ...(params.q?.trim() ? { q: params.q.trim() } : {}),
      },
    },
  )
  return {
    items: Array.isArray(data.items) ? data.items : [],
    total: Number.isFinite(data.total) ? Number(data.total) : 0,
  }
}

export async function fetchSuperAdminBusinessById(
  id: string,
): Promise<BusinessWithSubscription> {
  const { data } = await api.get<BusinessWithSubscription>(
    `${SUPER_ADMIN_BUSINESSES_PATH}/${encodeURIComponent(id)}`,
  )
  return data
}
