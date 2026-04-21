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

/** Alineado a la lista de reservas: terminadas no ocupan mesa en el plano. */
export function isAdminReservationTerminated(status: string): boolean {
  const s = status.toLowerCase()
  return s === "cancelled" || s === "closed"
}

function formatReservationTimeRange(startIso: string, endIso: string): string {
  const a = formatReservationTime(startIso)
  const b = formatReservationTime(endIso)
  if (a === "—" && b === "—") return "—"
  return `${a} – ${b}`
}

/** Una reserva asociada a una mesa para la vista de plano. */
export interface TableReservationSlot {
  reservationId: string
  status: string
  /** ISO8601 del inicio (para ordenar). */
  startTimeIso: string
  timeRangeLabel: string
  customerLabel: string
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

/**
 * Agrupa `reservation_table` por `table_id` (solo reservas no terminadas).
 */
export function aggregateReservationsByTableId(
  raws: AdminReservationRaw[],
): Map<string, TableReservationSlot[]> {
  const map = new Map<string, TableReservationSlot[]>()

  for (const raw of raws) {
    if (isAdminReservationTerminated(raw.status)) continue
    const links = raw.reservation_table ?? []
    for (const link of links) {
      const tid = link.table_id
      if (!tid) continue
      const slot: TableReservationSlot = {
        reservationId: raw.id,
        status: raw.status,
        startTimeIso: raw.start_time,
        timeRangeLabel: formatReservationTimeRange(raw.start_time, raw.end_time),
        customerLabel: mapCustomerToLabel(raw.customer ?? null),
      }
      const arr = map.get(tid) ?? []
      arr.push(slot)
      map.set(tid, arr)
    }
  }

  for (const [tid, arr] of map) {
    arr.sort(
      (a, b) =>
        new Date(a.startTimeIso).getTime() - new Date(b.startTimeIso).getTime(),
    )
    map.set(tid, arr)
  }

  return map
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

function todayLocalISODate(): string {
  const n = new Date()
  const y = n.getFullYear()
  const m = String(n.getMonth() + 1).padStart(2, "0")
  const d = String(n.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** Todas las reservas del día local (paginado en el servidor). */
export async function fetchTodayReservationRaws(options?: {
  maxPages?: number
}): Promise<AdminReservationRaw[]> {
  const today = todayLocalISODate()
  const maxPages = options?.maxPages ?? 50
  let page = 1
  const all: AdminReservationRaw[] = []
  for (;;) {
    const data = await fetchAdminReservations({
      page,
      dateFrom: today,
      dateTo: today,
      status: ADMIN_RESERVATIONS_STATUS_ALL,
    })
    all.push(...data.items)
    const totalPages = data.totalPages > 0 ? data.totalPages : 1
    if (page >= totalPages || page >= maxPages) break
    page += 1
  }
  return all
}
