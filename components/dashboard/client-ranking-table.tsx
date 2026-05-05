"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowUpDown, ArrowUp, ArrowDown, AlertCircle } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  fetchClientRanking,
  type ClientRankingEntry,
} from "@/lib/requests/analytics"

function firstDayOfMonth(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

type SortKey = "orderCount" | "totalSpend" | "avgOrderValue"
type SortDir = "asc" | "desc"

function formatARS(v: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(v)
}

function formatDate(iso: string): string {
  if (!iso) return "—"
  const parts = iso.split("-")
  return `${parseInt(parts[2], 10)}/${parseInt(parts[1], 10)}/${parts[0]}`
}

function clientDisplayName(entry: ClientRankingEntry): string {
  return entry.name?.trim() || entry.phone || entry.customerId.slice(0, 8)
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="ml-1 size-3 opacity-40 shrink-0" />
  return dir === "desc"
    ? <ArrowDown className="ml-1 size-3 shrink-0" />
    : <ArrowUp className="ml-1 size-3 shrink-0" />
}

export function ClientRankingTable() {
  const [sortKey, setSortKey] = useState<SortKey>("orderCount")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [dateFrom, setDateFrom] = useState(firstDayOfMonth)
  const [dateTo, setDateTo]     = useState(todayISO)
  const [apiData, setApiData]   = useState<ClientRankingEntry[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchClientRanking({ from: dateFrom, to: dateTo })
      setApiData(res.data)
    } catch {
      setError("No se pudo cargar el ranking de clientes.")
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo])

  useEffect(() => { void load() }, [load])

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"))
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  const sorted = useMemo<ClientRankingEntry[]>(() => {
    return [...apiData].sort((a, b) => {
      const diff = a[sortKey] - b[sortKey]
      return sortDir === "desc" ? -diff : diff
    })
  }, [apiData, sortKey, sortDir])

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 pb-4">
        <div>
          <CardTitle className="text-base">Ranking de clientes</CardTitle>
          <CardDescription className="text-xs mt-1">
            Ordená por frecuencia o gasto
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="cr-from" className="text-xs">Desde</Label>
            <Input
              id="cr-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-8 w-[144px] text-xs"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="cr-to" className="text-xs">Hasta</Label>
            <Input
              id="cr-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-8 w-[144px] text-xs"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 pb-2">
        {error ? (
          <div className="flex items-center justify-center gap-2 px-6 py-10 text-sm text-muted-foreground">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </div>
        ) : loading ? (
          <div className="space-y-2 px-6 pb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted-foreground">
            Sin clientes con pedidos en el período.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 pl-6 text-center">#</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("orderCount")}
                      className="flex items-center gap-0.5 text-xs font-medium transition-colors hover:text-foreground"
                    >
                      Pedidos
                      <SortIcon active={sortKey === "orderCount"} dir={sortDir} />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("totalSpend")}
                      className="flex items-center gap-0.5 text-xs font-medium transition-colors hover:text-foreground"
                    >
                      Gasto total
                      <SortIcon active={sortKey === "totalSpend"} dir={sortDir} />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("avgOrderValue")}
                      className="flex items-center gap-0.5 text-xs font-medium transition-colors hover:text-foreground"
                    >
                      Ticket prom.
                      <SortIcon active={sortKey === "avgOrderValue"} dir={sortDir} />
                    </button>
                  </TableHead>
                  <TableHead className="pr-6 text-right">Último pedido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((client, index) => (
                  <TableRow key={client.customerId}>
                    <TableCell className="pl-6 text-center text-xs tabular-nums text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {index === 0 && (
                          <Badge className="h-5 shrink-0 px-1.5 py-0 text-xs">
                            Top
                          </Badge>
                        )}
                        <span className="text-sm font-medium">
                          {clientDisplayName(client)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums text-sm">
                      {client.orderCount}
                    </TableCell>
                    <TableCell className="tabular-nums text-sm font-medium">
                      {formatARS(client.totalSpend)}
                    </TableCell>
                    <TableCell className="tabular-nums text-sm text-muted-foreground">
                      {formatARS(client.avgOrderValue)}
                    </TableCell>
                    <TableCell className="pr-6 text-right text-sm text-muted-foreground">
                      {formatDate(client.lastOrderDate)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
