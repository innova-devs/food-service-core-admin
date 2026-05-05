import { api } from "@/lib/api"

// ─── Response types ───────────────────────────────────────────────────────────

export interface OrderVolumePoint {
  /** ISO YYYY-MM-DD */
  date: string
  units: number
  revenue: number
}

export interface OrderVolumeResponse {
  period: { from: string; to: string; tz?: string | null }
  data: OrderVolumePoint[]
}

export interface ClientRankingEntry {
  customerId: string
  name: string | null
  phone?: string | null
  orderCount: number
  totalSpend: number
  avgOrderValue: number
  /** ISO YYYY-MM-DD */
  lastOrderDate: string
}

export interface ClientRankingResponse {
  period: { from: string; to: string; tz?: string | null }
  data: ClientRankingEntry[]
}

export interface TopDishEntry {
  menuItemId: string
  name: string
  orderCount: number
  revenue: number
}

export interface TopDishesResponse {
  period: { from: string; to: string; tz?: string | null }
  data: TopDishEntry[]
}

// ─── Normalization helpers ────────────────────────────────────────────────────

function asNum(v: unknown): number {
  if (v == null) return 0
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

function asStr(v: unknown): string {
  return v != null ? String(v) : ""
}

function normalizePeriod(
  raw: unknown,
): { from: string; to: string; tz?: string | null } {
  const r =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
  return {
    from: asStr(r.from),
    to: asStr(r.to),
    tz: r.tz != null ? asStr(r.tz) : null,
  }
}

function normalizeVolumePoint(raw: unknown): OrderVolumePoint {
  const r =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
  return {
    date: asStr(r.date),
    units: asNum(r.units),
    revenue: asNum(r.revenue),
  }
}

function normalizeOrderVolume(raw: unknown): OrderVolumeResponse {
  const r =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
  return {
    period: normalizePeriod(r.period),
    data: Array.isArray(r.data) ? r.data.map(normalizeVolumePoint) : [],
  }
}

function normalizeClientEntry(raw: unknown): ClientRankingEntry {
  const r =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
  return {
    customerId: asStr(r.customer_id ?? r.customerId),
    name: r.name != null ? asStr(r.name) : null,
    phone: r.phone != null ? asStr(r.phone) : null,
    orderCount: asNum(r.order_count ?? r.orderCount),
    totalSpend: asNum(r.total_spend ?? r.totalSpend),
    avgOrderValue: asNum(r.avg_order_value ?? r.avgOrderValue),
    lastOrderDate: asStr(r.last_order_date ?? r.lastOrderDate),
  }
}

function normalizeClientRanking(raw: unknown): ClientRankingResponse {
  const r =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
  return {
    period: normalizePeriod(r.period),
    data: Array.isArray(r.data) ? r.data.map(normalizeClientEntry) : [],
  }
}

function normalizeTopDishEntry(raw: unknown): TopDishEntry {
  const r =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
  return {
    menuItemId: asStr(r.menu_item_id ?? r.menuItemId),
    name: asStr(r.name),
    orderCount: asNum(r.order_count ?? r.orderCount),
    revenue: asNum(r.revenue),
  }
}

function normalizeTopDishes(raw: unknown): TopDishesResponse {
  const r =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
  return {
    period: normalizePeriod(r.period),
    data: Array.isArray(r.data) ? r.data.map(normalizeTopDishEntry) : [],
  }
}

// ─── Params ───────────────────────────────────────────────────────────────────

export interface AnalyticsDateParams {
  from: string
  to: string
  tz?: string
}

// ─── Fetch functions ──────────────────────────────────────────────────────────

export async function fetchOrderVolume(
  params: AnalyticsDateParams,
): Promise<OrderVolumeResponse> {
  const { data } = await api.get<unknown>("/admin/analytics/order-volume", {
    params: {
      from: params.from,
      to: params.to,
      ...(params.tz?.trim() ? { tz: params.tz.trim() } : {}),
    },
  })
  return normalizeOrderVolume(data)
}

export async function fetchClientRanking(
  params: AnalyticsDateParams & { limit?: number },
): Promise<ClientRankingResponse> {
  const { data } = await api.get<unknown>("/admin/analytics/client-ranking", {
    params: {
      from: params.from,
      to: params.to,
      ...(params.limit != null ? { limit: params.limit } : {}),
      ...(params.tz?.trim() ? { tz: params.tz.trim() } : {}),
    },
  })
  return normalizeClientRanking(data)
}

export async function fetchTopDishes(
  params: AnalyticsDateParams & { limit?: number },
): Promise<TopDishesResponse> {
  const { data } = await api.get<unknown>("/admin/analytics/top-dishes", {
    params: {
      from: params.from,
      to: params.to,
      ...(params.limit != null ? { limit: params.limit } : {}),
      ...(params.tz?.trim() ? { tz: params.tz.trim() } : {}),
    },
  })
  return normalizeTopDishes(data)
}

// ─── Date range helper ────────────────────────────────────────────────────────

/**
 * Returns `from`/`to` as local ISO strings (YYYY-MM-DD) for the last N
 * calendar days, with "today" as the end of the range.
 */
export function lastNDaysRange(days: number): { from: string; to: string } {
  const to = new Date()
  const from = new Date(to)
  from.setDate(from.getDate() - days + 1)
  const fmt = (d: Date): string => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${day}`
  }
  return { from: fmt(from), to: fmt(to) }
}
