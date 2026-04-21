import { api } from "@/lib/api"

export const ADMIN_BUSINESS_HOURS_PATH = "/admin/business-hours"

export interface AdminBusinessHour {
  id: string
  businessId: string
  dayOfWeek: number
  opensAt: string
  closesAt: string
  isClosed: boolean
  createdAt: string
}

export type AdminBusinessHourCreateInput = {
  dayOfWeek: number
  opensAt: string
  closesAt: string
  isClosed?: boolean
}

export type AdminBusinessHourPatchInput = Partial<{
  dayOfWeek: number
  opensAt: string
  closesAt: string
  isClosed: boolean
}>

type ListResponse = { items?: unknown[] }
type DeleteResponse = { success?: boolean; id?: string }

function mapRow(raw: Record<string, unknown>): AdminBusinessHour {
  return {
    id: String(raw.id ?? ""),
    businessId: String(raw.businessId ?? raw.business_id ?? ""),
    dayOfWeek: Number(raw.dayOfWeek ?? raw.day_of_week ?? 0),
    opensAt: String(raw.opensAt ?? raw.opens_at ?? "00:00"),
    closesAt: String(raw.closesAt ?? raw.closes_at ?? "00:00"),
    isClosed: Boolean(raw.isClosed ?? raw.is_closed ?? false),
    createdAt: String(raw.createdAt ?? raw.created_at ?? ""),
  }
}

export async function fetchAdminBusinessHours(): Promise<AdminBusinessHour[]> {
  const { data } = await api.get<ListResponse | unknown[]>(ADMIN_BUSINESS_HOURS_PATH)
  const items = Array.isArray(data) ? data : Array.isArray(data.items) ? data.items : []
  return items.map((row) => mapRow(row as Record<string, unknown>))
}

export async function createAdminBusinessHour(
  input: AdminBusinessHourCreateInput,
): Promise<AdminBusinessHour> {
  const payload = {
    dayOfWeek: input.dayOfWeek,
    opensAt: input.opensAt,
    closesAt: input.closesAt,
    isClosed: Boolean(input.isClosed),
  }
  const { data } = await api.post(ADMIN_BUSINESS_HOURS_PATH, payload)
  return mapRow(data as Record<string, unknown>)
}

export async function fetchAdminBusinessHourById(id: string): Promise<AdminBusinessHour> {
  const { data } = await api.get(`${ADMIN_BUSINESS_HOURS_PATH}/${encodeURIComponent(id)}`)
  return mapRow(data as Record<string, unknown>)
}

export async function patchAdminBusinessHour(
  id: string,
  input: AdminBusinessHourPatchInput,
): Promise<AdminBusinessHour> {
  const payload: Record<string, unknown> = {}
  if (input.dayOfWeek != null) payload.dayOfWeek = input.dayOfWeek
  if (input.opensAt != null) payload.opensAt = input.opensAt
  if (input.closesAt != null) payload.closesAt = input.closesAt
  if (input.isClosed != null) payload.isClosed = input.isClosed

  const { data } = await api.patch(
    `${ADMIN_BUSINESS_HOURS_PATH}/${encodeURIComponent(id)}`,
    payload,
  )
  return mapRow(data as Record<string, unknown>)
}

export async function deleteAdminBusinessHour(
  id: string,
): Promise<{ success: boolean; id: string }> {
  const { data } = await api.delete<DeleteResponse>(
    `${ADMIN_BUSINESS_HOURS_PATH}/${encodeURIComponent(id)}`,
  )
  return {
    success: Boolean(data?.success),
    id: String(data?.id ?? id),
  }
}
