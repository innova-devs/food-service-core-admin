import { api } from "@/lib/api"

/** Relativo a `NEXT_PUBLIC_API`. */
export const ADMIN_DASHBOARD_SUMMARY_PATH = "/admin/dashboard/summary"

export interface AdminDashboardSummary {
  period: {
    from: string
    to: string
    tz?: string | null
  }
  previousPeriod?: {
    from: string
    to: string
  }
  orders: {
    /** Pedidos en el período (sin contar `draft`). */
    total: number
    deltaPct: number | null
    byStatus: Record<string, number>
    byPaymentStatus: Record<string, number>
  }
  reservations: {
    total?: number
    active?: number
    deltaPct?: number | null
    byStatus?: Record<string, number>
  }
}

function num(v: unknown): number | null {
  if (v == null || v === "") return null
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

function recordCounts(v: unknown): Record<string, number> {
  if (!v || typeof v !== "object") return {}
  const out: Record<string, number> = {}
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    const n = num(val)
    if (n != null) out[k] = n
  }
  return out
}

function normalizeDashboardSummary(raw: unknown): AdminDashboardSummary {
  const r = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}
  const periodRaw = r.period && typeof r.period === "object" ? (r.period as Record<string, unknown>) : {}
  const prevRaw =
    (r.previousPeriod && typeof r.previousPeriod === "object"
      ? r.previousPeriod
      : r.previous_period && typeof r.previous_period === "object"
        ? r.previous_period
        : null) as Record<string, unknown> | null

  const ordersRaw =
    r.orders && typeof r.orders === "object" ? (r.orders as Record<string, unknown>) : {}
  const resRaw =
    r.reservations && typeof r.reservations === "object"
      ? (r.reservations as Record<string, unknown>)
      : {}

  const byStatus =
    recordCounts(ordersRaw.byStatus ?? ordersRaw.by_status)
  const byPayment =
    recordCounts(ordersRaw.byPaymentStatus ?? ordersRaw.by_payment_status)
  const resByStatus =
    recordCounts(resRaw.byStatus ?? resRaw.by_status)

  const deltaOrders = num(ordersRaw.deltaPct ?? ordersRaw.delta_pct)
  const deltaRes = num(resRaw.deltaPct ?? resRaw.delta_pct)

  return {
    period: {
      from: String(periodRaw.from ?? ""),
      to: String(periodRaw.to ?? ""),
      tz: periodRaw.tz != null ? String(periodRaw.tz) : null,
    },
    previousPeriod:
      prevRaw && typeof prevRaw.from === "string" && typeof prevRaw.to === "string"
        ? { from: prevRaw.from, to: prevRaw.to }
        : undefined,
    orders: {
      total: num(ordersRaw.total) ?? 0,
      deltaPct: deltaOrders,
      byStatus,
      byPaymentStatus: byPayment,
    },
    reservations: {
      total: num(resRaw.total) ?? undefined,
      active: num(resRaw.active) ?? undefined,
      deltaPct: deltaRes,
      byStatus: resByStatus,
    },
  }
}

export async function fetchAdminDashboardSummary(params: {
  from: string
  to: string
  tz?: string
}) {
  const { data } = await api.get<unknown>(ADMIN_DASHBOARD_SUMMARY_PATH, {
    params: {
      from: params.from,
      to: params.to,
      ...(params.tz?.trim() ? { tz: params.tz.trim() } : {}),
    },
  })
  return normalizeDashboardSummary(data)
}
