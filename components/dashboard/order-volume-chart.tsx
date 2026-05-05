"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts"
import { AlertCircle } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  fetchOrderVolume,
  lastNDaysRange,
  type OrderVolumePoint,
} from "@/lib/requests/analytics"

type Metric = "units" | "revenue"
type Range = "7" | "14" | "30"

const SHORT_MONTHS = [
  "", "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
]

function toShortDate(iso: string): string {
  const parts = iso.split("-")
  const m = parseInt(parts[1], 10)
  const d = parseInt(parts[2], 10)
  return `${d} ${SHORT_MONTHS[m]}`
}

function formatARS(v: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(v)
}

const chartConfig = {
  units:   { label: "Pedidos" },
  revenue: { label: "Ingresos (ARS)" },
}

const COLORS: Record<Metric, string> = {
  units:   "hsl(221 83% 53%)",
  revenue: "hsl(142 71% 45%)",
}

export function OrderVolumeChart() {
  const [metric, setMetric] = useState<Metric>("units")
  const [range, setRange]   = useState<Range>("30")
  const [apiData, setApiData] = useState<OrderVolumePoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const { from, to } = useMemo(() => lastNDaysRange(Number(range)), [range])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchOrderVolume({ from, to })
      setApiData(res.data)
    } catch {
      setError("No se pudo cargar el volumen de pedidos.")
    } finally {
      setLoading(false)
    }
  }, [from, to])

  useEffect(() => { void load() }, [load])

  const chartData = useMemo(
    () => apiData.map((d) => ({ ...d, dateLabel: toShortDate(d.date) })),
    [apiData],
  )

  const color = COLORS[metric]
  const gradId = "grad-order-volume"

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between pb-4">
        <div>
          <CardTitle className="text-base">Volumen de pedidos</CardTitle>
          <CardDescription className="text-xs mt-1">
            Evolución diaria en el período seleccionado
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ToggleGroup
            type="single"
            value={metric}
            onValueChange={(v) => { if (v) setMetric(v as Metric) }}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="units" className="text-xs h-8 px-3">
              Unidades
            </ToggleGroupItem>
            <ToggleGroupItem value="revenue" className="text-xs h-8 px-3">
              $ Ingresos
            </ToggleGroupItem>
          </ToggleGroup>
          <Select value={range} onValueChange={(v) => setRange(v as Range)}>
            <SelectTrigger className="h-8 w-[144px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 días</SelectItem>
              <SelectItem value="14">Últimos 14 días</SelectItem>
              <SelectItem value="30">Últimos 30 días</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {error ? (
          <div className="flex h-[260px] items-center justify-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </div>
        ) : loading ? (
          <div className="space-y-3">
            <Skeleton className="h-[260px] w-full rounded-md" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
            Sin pedidos en el período seleccionado.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[260px] w-full">
            <AreaChart data={chartData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={color} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke="hsl(var(--border))"
                strokeOpacity={0.5}
              />
              <XAxis
                dataKey="dateLabel"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={metric === "revenue" ? 52 : 32}
                tickFormatter={
                  metric === "revenue"
                    ? (v: number) => `$${Math.round(v / 1000)}k`
                    : undefined
                }
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) =>
                      metric === "revenue"
                        ? formatARS(Number(value))
                        : String(value)
                    }
                  />
                }
              />
              <Area
                type="monotone"
                dataKey={metric}
                stroke={color}
                strokeWidth={2}
                fill={`url(#${gradId})`}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: color }}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
