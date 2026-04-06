import { api } from "@/lib/api"
import { orderCustomerLabel, type OrderCustomer, type Reservation } from "@/lib/data"
import type { AdminCustomerRaw } from "@/lib/requests/orders"

/** Relativo a `NEXT_PUBLIC_API` (si ya incluye `/api`, la URL final es correcta). */
export const ADMIN_RESERVATIONS_PATH = "/admin/reservations"

export const ADMIN_RESERVATIONS_STATUS_ALL = "all" as const

export interface AdminReservationsListParams {
  page: number
  dateFrom: string
  dateTo: string
  customerPhone?: string
  status?: string
}

export interface AdminReservationsListResponse {
  total: number
  page: number
  pageSize: number
  totalPages: number
  items: AdminReservationRaw[]
}

export interface AdminTableEnvironmentRaw {
  id: string
  name: string
}

export interface AdminTableRaw {
  id: string
  business_id: string
  environment_id: string
  name: string
  capacity: number
  is_active?: boolean
  created_at?: string
  environment?: AdminTableEnvironmentRaw | null
}

export interface AdminReservationTableLinkRaw {
  id: string
  reservation_id: string
  table_id: string
  table?: AdminTableRaw | null
}

export interface AdminReservationRaw {
  id: string
  business_id: string
  customer_id: string
  conversation_id: string | null
  party_size: number
  reservation_date: string
  start_time: string
  end_time: string
  status: string
  notes: string | null
  created_at: string
  arrived_count?: number
  checkin_token?: string | null
  customer?: AdminCustomerRaw | null
  reservation_table?: AdminReservationTableLinkRaw[]
}

function formatReservationTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}

function tablesLabelFrom(
  links: AdminReservationTableLinkRaw[] | undefined,
): string | null {
  if (!links?.length) return null
  const parts = links
    .map((link) => {
      const t = link.table
      if (!t?.name) return null
      const env = t.environment?.name
      return env ? `${t.name} (${env})` : t.name
    })
    .filter((p): p is string => Boolean(p))
  return parts.length ? parts.join(", ") : null
}

function mapCustomerToLabel(c: AdminCustomerRaw | null | undefined): string {
  if (!c) return "—"
  const oc: OrderCustomer = {
    name: c.name,
    phoneNumber: c.phone_number ?? "",
  }
  return orderCustomerLabel(oc)
}

export function mapAdminReservationToReservation(
  raw: AdminReservationRaw,
): Reservation {
  return {
    id: raw.id,
    customerName: mapCustomerToLabel(raw.customer),
    date: new Date(raw.reservation_date),
    time: formatReservationTime(raw.start_time),
    guests: raw.party_size,
    status: raw.status,
    tablesLabel: tablesLabelFrom(raw.reservation_table),
    notes: raw.notes,
  }
}

export async function fetchAdminReservationById(id: string) {
  const { data } = await api.get<AdminReservationRaw>(
    `${ADMIN_RESERVATIONS_PATH}/${id}`,
  )
  return mapAdminReservationToReservation(data)
}

export async function fetchAdminReservations(
  params: AdminReservationsListParams,
) {
  const statusParam =
    params.status && params.status !== ADMIN_RESERVATIONS_STATUS_ALL
      ? params.status
      : undefined
  const { data } = await api.get<AdminReservationsListResponse>(
    ADMIN_RESERVATIONS_PATH,
    {
      params: {
        page: params.page,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        ...(params.customerPhone?.trim()
          ? { customerPhone: params.customerPhone.trim() }
          : {}),
        ...(statusParam ? { status: statusParam } : {}),
      },
    },
  )
  return data
}
