"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from "recharts"
import { AlertCircle } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  fetchTopDishes,
  type TopDishEntry,
} from "@/lib/requests/analytics"

function firstDayOfMonth(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

type ViewMode = "list" | "chart"

function formatARS(v: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(v)
}

const CHART_COLOR = "hsl(25 95% 53%)"

const chartConfig = {
  orderCount: { label: "Pedidos" },
}

export function TopDishesTable() {
  const [dateFrom, setDateFrom] = useState(firstDayOfMonth)
  const [dateTo, setDateTo]     = useState(todayISO)
  const [view, setView]         = useState<ViewMode>("list")
  const [apiData, setApiData]   = useState<TopDishEntry[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchTopDishes({ from: dateFrom, to: dateTo, limit: 10 })
      setApiData(res.data)
    } catch {
      setError("No se pudo cargar el ranking de platos.")
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo])

  useEffect(() => { void load() }, [load])

  const maxOrders = useMemo(
    () => (apiData.length > 0 ? Math.max(...apiData.map((d) => d.orderCount)) : 0),
    [apiData],
  )

  const chartData = useMemo(
    () =>
      apiData.map((d) => ({
        ...d,
        shortName: d.name.length > 16 ? `${d.name.slice(0, 15)}…` : d.name,
      })),
    [apiData],
  )

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Platos más pedidos</CardTitle>
            <CardDescription className="text-xs mt-1">
              Top 10 por cantidad en el período
            </CardDescription>
          </div>
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(v) => { if (v) setView(v as ViewMode) }}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="list" className="text-xs h-8 px-3">
              Lista
            </ToggleGroupItem>
            <ToggleGroupItem value="chart" className="text-xs h-8 px-3">
              Gráfico
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="td-from" className="text-xs">Desde</Label>
            <Input
              id="td-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-8 w-[144px] text-xs"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="td-to" className="text-xs">Hasta</Label>
            <Input
              id="td-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-8 w-[144px] text-xs"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {error ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </div>
        ) : loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : apiData.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Sin platos pedidos en el período.
          </p>
        ) : view === "list" ? (
          <div className="space-y-3">
            {apiData.map((dish, index) => {
              const pct =
                maxOrders > 0
                  ? Math.round((dish.orderCount / maxOrders) * 100)
                  : 0
              return (
                <div key={dish.menuItemId} className="flex items-center gap-3">
                  <span className="w-5 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                      <span className="truncate font-medium">{dish.name}</span>
                      <div className="flex shrink-0 items-center gap-4">
                        <span className="tabular-nums text-muted-foreground">
                          {dish.orderCount} pedidos
                        </span>
                        <span className="w-24 text-right tabular-nums font-medium">
                          {formatARS(dish.revenue)}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: CHART_COLOR,
                          opacity: 0.7,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 8, left: 8, bottom: 0 }}
            >
              <CartesianGrid
                horizontal={false}
                stroke="hsl(var(--border))"
                strokeOpacity={0.5}
              />
              <XAxis
                type="number"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="shortName"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={110}
              />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="orderCount" radius={[0, 4, 4, 0]} maxBarSize={20}>
                {chartData.map((entry) => (
                  <Cell key={entry.menuItemId} fill={CHART_COLOR} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
