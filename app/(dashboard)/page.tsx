"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { isAxiosError } from "axios"
import {
  ShoppingCart,
  CalendarDays,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Users,
  Star,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ORDER_STATUS_PIPELINE,
  getOrderPaymentStatusLabelEs,
  getOrderStatusLabelEs,
} from "@/lib/constants/orderWorkflow"
import {
  fetchAdminDashboardSummary,
  type AdminDashboardSummary,
} from "@/lib/requests/dashboard"
import {
  fetchOrderVolume,
  fetchClientRanking,
  fetchTopDishes,
  lastNDaysRange,
  type ClientRankingEntry,
  type TopDishEntry,
} from "@/lib/requests/analytics"
import { AnalyticsTabs } from "@/components/dashboard/analytics-tabs"
import { ClientRankingIdentityLines } from "@/components/dashboard/client-ranking-identity-lines"

/** Fecha local `YYYY-MM-DD` (alineado a “hoy” en el navegador). */
function todayISOInLocal(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function formatTodayLong(): string {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date())
}

const RESERVATION_STATUS_ORDER = [
  "pending",
  "confirmed",
  "cancelled",
  "closed",
] as const

const PAYMENT_ORDER = ["unpaid", "paid", "pending", "deferred"] as const

function reservationStatusLabelEs(key: string): string {
  const k = key.toLowerCase()
  const map: Record<string, string> = {
    pending: "Pendiente",
    confirmed: "Confirmada",
    cancelled: "Cancelada",
    closed: "Cerrada",
  }
  return map[k] ?? key
}

function sortOrderStatusKeys(keys: string[]): string[] {
  const pipeline = [...ORDER_STATUS_PIPELINE, "cancelled"]
  const seen = new Set<string>()
  const out: string[] = []
  for (const p of pipeline) {
    if (keys.includes(p)) {
      out.push(p)
      seen.add(p)
    }
  }
  for (const k of [...keys].sort()) {
    if (!seen.has(k)) out.push(k)
  }
  return out
}

function sortPaymentKeys(keys: string[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const p of PAYMENT_ORDER) {
    if (keys.includes(p)) {
      out.push(p)
      seen.add(p)
    }
  }
  for (const k of [...keys].sort()) {
    if (!seen.has(k)) out.push(k)
  }
  return out
}

function sortReservationKeys(keys: string[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const p of RESERVATION_STATUS_ORDER) {
    if (keys.includes(p)) {
      out.push(p)
      seen.add(p)
    }
  }
  for (const k of [...keys].sort()) {
    if (!seen.has(k)) out.push(k)
  }
  return out
}

function formatDeltaPct(pct: number | null | undefined): string {
  if (pct == null || Number.isNaN(pct)) {
    return "Sin comparación con el día anterior"
  }
  if (pct === 0) return "Igual que el día anterior"
  const sign = pct > 0 ? "+" : ""
  return `${sign}${pct}% vs día anterior`
}

function BreakdownBlock({
  entries,
}: {
  entries: { key: string; label: string; count: number }[]
}) {
  const max = useMemo(
    () => entries.reduce((m, e) => Math.max(m, e.count), 0),
    [entries],
  )
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Sin datos para hoy.</p>
    )
  }
  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {entries.map(({ key, label, count }) => {
          const pct = max > 0 ? Math.round((count / max) * 100) : 0
          return (
            <li key={key}>
              <div className="flex justify-between gap-2 text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="tabular-nums font-medium">{count}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary/70 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

interface AnalyticsKPIs {
  units: number
  revenue: number
  topClient: ClientRankingEntry | null
  topDish: TopDishEntry | null
}

function formatARS(v: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(v)
}

export default function DashboardPage() {
  const [data, setData] = useState<AdminDashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [analyticsKPIs, setAnalyticsKPIs] = useState<AnalyticsKPIs | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)

  const loadAnalyticsKPIs = useCallback(async () => {
    setAnalyticsLoading(true)
    try {
      const { from, to } = lastNDaysRange(30)
      const [volumeRes, clientRes, dishRes] = await Promise.all([
        fetchOrderVolume({ from, to }),
        fetchClientRanking({ from, to, limit: 1 }),
        fetchTopDishes({ from, to, limit: 1 }),
      ])
      const units   = volumeRes.data.reduce((s, d) => s + d.units, 0)
      const revenue = volumeRes.data.reduce((s, d) => s + d.revenue, 0)
      setAnalyticsKPIs({
        units,
        revenue,
        topClient: clientRes.data[0] ?? null,
        topDish:   dishRes.data[0]   ?? null,
      })
    } catch {
      setAnalyticsKPIs(null)
    } finally {
      setAnalyticsLoading(false)
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const today = todayISOInLocal()
      const summary = await fetchAdminDashboardSummary({
        from: today,
        to: today,
      })
      setData(summary)
    } catch (e) {
      setData(null)
      if (isAxiosError(e)) {
        const msg =
          (e.response?.data as { message?: string })?.message ?? e.message
        setError(
          typeof msg === "string" && msg
            ? msg
            : "No se pudo cargar el resumen. Revisá la API y la sesión.",
        )
      } else {
        setError("Error inesperado al cargar el dashboard.")
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    void loadAnalyticsKPIs()
  }, [load, loadAnalyticsKPIs])

  const orderStatusEntries = useMemo(() => {
    if (!data) return []
    const keys = sortOrderStatusKeys(
      Object.keys(data.orders.byStatus).filter(
        (k) => k.toLowerCase() !== "draft",
      ),
    )
    return keys.map((key) => ({
      key,
      label: getOrderStatusLabelEs(key),
      count: data.orders.byStatus[key] ?? 0,
    }))
  }, [data])

  const paymentEntries = useMemo(() => {
    if (!data) return []
    const keys = sortPaymentKeys(Object.keys(data.orders.byPaymentStatus))
    return keys.map((key) => ({
      key,
      label: getOrderPaymentStatusLabelEs(key),
      count: data.orders.byPaymentStatus[key] ?? 0,
    }))
  }, [data])

  const reservationEntries = useMemo(() => {
    const by = data?.reservations.byStatus
    if (!by || Object.keys(by).length === 0) return []
    const keys = sortReservationKeys(Object.keys(by))
    return keys.map((key) => ({
      key,
      label: reservationStatusLabelEs(key),
      count: by[key] ?? 0,
    }))
  }, [data])

  const reservationMain =
    data?.reservations.active ?? data?.reservations.total ?? null
  const reservationDelta = data?.reservations.deltaPct

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Vista rápida de pedidos y reservas; el detalle está en cada sección.
          </p>
          <p className="mt-2 text-sm font-medium capitalize text-foreground">
            Hoy · {formatTodayLong()}
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="default"
          disabled={loading}
          onClick={() => void load()}
          className="shrink-0"
        >
          <RefreshCw
            className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`}
          />
          Actualizar
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
            <div className="space-y-1">
              <CardTitle className="text-base leading-tight">
                Pedidos para hoy
              </CardTitle>
              <CardDescription className="text-xs leading-snug">
                Total con flujo iniciado (no incluye borradores / &quot;draft&quot;).
              </CardDescription>
            </div>
            <ShoppingCart className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <>
                <Skeleton className="h-9 w-24" />
                <Skeleton className="mt-2 h-4 w-40" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold tabular-nums">
                  {data?.orders.total ?? "—"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDeltaPct(data?.orders.deltaPct)}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
            <div className="space-y-1">
              <CardTitle className="text-base leading-tight">
                Reservas para hoy
              </CardTitle>
              <CardDescription className="text-xs leading-snug">
                {data?.reservations.active != null
                  ? "Reservas activas hoy (según reglas del informe)."
                  : data?.reservations.total != null
                    ? "Total de reservas registradas para hoy."
                    : "Métrica de reservas del día."}
              </CardDescription>
            </div>
            <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <>
                <Skeleton className="h-9 w-24" />
                <Skeleton className="mt-2 h-4 w-40" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold tabular-nums">
                  {reservationMain != null ? reservationMain : "—"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {data?.reservations.active != null
                    ? "Activas hoy · "
                    : data?.reservations.total != null
                      ? "Total hoy · "
                      : ""}
                  {formatDeltaPct(reservationDelta)}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analytics KPI cards — últimos 30 días */}
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Últimos 30 días
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-base leading-tight">
                  Volumen de pedidos
                </CardTitle>
                <CardDescription className="text-xs leading-snug">
                  Total de unidades en el período
                </CardDescription>
              </div>
              <TrendingUp className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <>
                  <Skeleton className="h-9 w-24" />
                  <Skeleton className="mt-2 h-4 w-32" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold tabular-nums">
                    {analyticsKPIs?.units ?? "—"}
                  </div>
                  <p className="text-xs text-muted-foreground">pedidos registrados</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-base leading-tight">
                  Ingresos totales
                </CardTitle>
                <CardDescription className="text-xs leading-snug">
                  Suma de facturación en el período
                </CardDescription>
              </div>
              <DollarSign className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <>
                  <Skeleton className="h-9 w-24" />
                  <Skeleton className="mt-2 h-4 w-28" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold tabular-nums">
                    {analyticsKPIs != null ? formatARS(analyticsKPIs.revenue) : "—"}
                  </div>
                  <p className="text-xs text-muted-foreground">en 30 días</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-base leading-tight">
                  Cliente frecuente
                </CardTitle>
                <CardDescription className="text-xs leading-snug">
                  Mayor cantidad de pedidos
                </CardDescription>
              </div>
              <Users className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <>
                  <Skeleton className="h-9 w-36" />
                  <Skeleton className="mt-2 h-4 w-40" />
                </>
              ) : analyticsKPIs?.topClient ? (
                <div className="space-y-1">
                  <ClientRankingIdentityLines
                    entry={analyticsKPIs.topClient}
                    primaryClassName="text-2xl font-bold"
                  />
                  <p className="text-xs text-muted-foreground">
                    {analyticsKPIs.topClient.orderCount} pedidos en el período
                  </p>
                </div>
              ) : (
                <div className="text-2xl font-bold">—</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-base leading-tight">
                  Plato estrella
                </CardTitle>
                <CardDescription className="text-xs leading-snug">
                  El más pedido del período
                </CardDescription>
              </div>
              <Star className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <>
                  <Skeleton className="h-9 w-36" />
                  <Skeleton className="mt-2 h-4 w-32" />
                </>
              ) : analyticsKPIs?.topDish ? (
                <>
                  <div className="truncate text-2xl font-bold">
                    {analyticsKPIs.topDish.name}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {analyticsKPIs.topDish.orderCount} veces pedido
                  </p>
                </>
              ) : (
                <div className="text-2xl font-bold">—</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {!loading && data ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Dónde está cada pedido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BreakdownBlock entries={orderStatusEntries} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Cómo está el cobro de esos pedidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BreakdownBlock entries={paymentEntries} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Reservas según su estado
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reservationEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Sin desglose por estado o sin reservas hoy.
                </p>
              ) : (
                <BreakdownBlock entries={reservationEntries} />
              )}
            </CardContent>
          </Card>
        </div>
      ) : loading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-48" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      <AnalyticsTabs />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ir al listado de pedidos</CardTitle>
            <CardDescription>
              Ver todos los pedidos, filtros y cambio de estado de envío
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/orders">
                Abrir pedidos
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ir al listado de reservas</CardTitle>
            <CardDescription>
              Ver reservas por fecha, estado y detalle de cada una
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/reservations">
                Abrir reservas
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
