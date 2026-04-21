"use client"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import { isAxiosError } from "axios"
import { toast } from "sonner"
import {
  Plus,
  Save,
  Move,
  Square,
  Circle,
  Users,
  Trash2,
  Loader2,
  X,
  CalendarClock,
} from "lucide-react"

import { useAdminSocket } from "@/contexts/admin-socket-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import {
  adminTableToUi,
  createAdminTable,
  deleteAdminTable,
  fetchAdminTables,
  patchAdminTable,
  uiTableToPatch,
  type UiTable,
} from "@/lib/requests/admin-tables"
import {
  aggregateReservationsByTableId,
  fetchTodayReservationRaws,
  type TableReservationSlot,
} from "@/lib/requests/reservations"

const statusColors = {
  active: "bg-emerald-500",
  inactive: "bg-gray-400",
}

const statusLabels = {
  active: "Activa",
  inactive: "Inactiva",
}

function apiErrorMessage(e: unknown, fallback: string): string {
  if (!isAxiosError(e)) return fallback
  const d = e.response?.data as {
    message?: string
    error?: string
    details?: unknown
  }
  const msg = d?.message ?? d?.error ?? e.message
  if (typeof msg === "string" && msg.trim()) return msg.trim()
  if (d?.details != null) {
    try {
      return `${fallback} (${JSON.stringify(d.details)})`
    } catch {
      return fallback
    }
  }
  return fallback
}

type SaveBanner =
  | { kind: "success"; message: string }
  | { kind: "error"; message: string }

export default function TablesPage() {
  const { subscribeToReservationRealtime } = useAdminSocket()
  const [tables, setTables] = useState<UiTable[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [savingLayout, setSavingLayout] = useState(false)
  const [savingProperties, setSavingProperties] = useState(false)
  const [deletingTable, setDeletingTable] = useState(false)
  const [saveBanner, setSaveBanner] = useState<SaveBanner | null>(null)
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState("")
  const [reservationByTableId, setReservationByTableId] = useState<
    Map<string, TableReservationSlot[]>
  >(() => new Map())
  const [reservationsError, setReservationsError] = useState<string | null>(null)
  const [reservationsLoading, setReservationsLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)

  const environmentOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const t of tables) {
      map.set(t.environmentId, t.environmentName)
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [tables])

  /** Un ambiente a la vez: no hay vista “todos mezclados”. */
  const activeEnvironmentId = useMemo(() => {
    if (environmentOptions.length === 0) return ""
    if (
      selectedEnvironmentId &&
      environmentOptions.some((e) => e.id === selectedEnvironmentId)
    ) {
      return selectedEnvironmentId
    }
    return environmentOptions[0].id
  }, [environmentOptions, selectedEnvironmentId])

  const loadReservationsMap = useCallback(async () => {
    setReservationsLoading(true)
    setReservationsError(null)
    try {
      const raws = await fetchTodayReservationRaws()
      setReservationByTableId(aggregateReservationsByTableId(raws))
    } catch (e) {
      setReservationsError(apiErrorMessage(e, "No se pudieron cargar las reservas del día."))
      setReservationByTableId(new Map())
    } finally {
      setReservationsLoading(false)
    }
  }, [])

  const loadTables = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const rows = await fetchAdminTables()
      setTables(rows.map(adminTableToUi))
      void loadReservationsMap()
    } catch (e) {
      setLoadError(apiErrorMessage(e, "No se pudieron cargar las mesas."))
    } finally {
      setIsLoading(false)
    }
  }, [loadReservationsMap])

  useEffect(() => {
    void loadTables()
  }, [loadTables])

  useEffect(() => {
    return subscribeToReservationRealtime(() => {
      void loadReservationsMap()
    })
  }, [subscribeToReservationRealtime, loadReservationsMap])

  const tablesInActiveEnvironment = useMemo(
    () =>
      activeEnvironmentId
        ? tables.filter((t) => t.environmentId === activeEnvironmentId)
        : [],
    [tables, activeEnvironmentId],
  )

  const selectedTable = tables.find((t) => t.id === selectedTableId) || null
  const selectedReservationSlots = selectedTableId
    ? reservationByTableId.get(selectedTableId)
    : undefined

  useEffect(() => {
    if (!selectedTableId || !activeEnvironmentId) return
    const row = tables.find((x) => x.id === selectedTableId)
    if (row && row.environmentId !== activeEnvironmentId) {
      setSelectedTableId(null)
    }
  }, [activeEnvironmentId, selectedTableId, tables])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, tableId: string) => {
      e.preventDefault()
      const table = tables.find((t) => t.id === tableId)
      if (!table || !canvasRef.current) return

      const canvasRect = canvasRef.current.getBoundingClientRect()
      setDragOffset({
        x: e.clientX - canvasRect.left - table.x,
        y: e.clientY - canvasRect.top - table.y,
      })
      setSelectedTableId(tableId)
      setIsDragging(true)
    },
    [tables],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !selectedTableId || !canvasRef.current) return

      const canvasRect = canvasRef.current.getBoundingClientRect()
      const newX = Math.max(
        0,
        Math.min(canvasRect.width - 100, e.clientX - canvasRect.left - dragOffset.x),
      )
      const newY = Math.max(
        0,
        Math.min(canvasRect.height - 80, e.clientY - canvasRect.top - dragOffset.y),
      )

      setTables((prev) =>
        prev.map((t) => (t.id === selectedTableId ? { ...t, x: newX, y: newY } : t)),
      )
    },
    [isDragging, selectedTableId, dragOffset],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedTableId(null)
    }
  }, [])

  const updateSelectedTable = useCallback(
    (updates: Partial<UiTable>) => {
      if (!selectedTableId) return
      setTables((prev) =>
        prev.map((t) => (t.id === selectedTableId ? { ...t, ...updates } : t)),
      )
    },
    [selectedTableId],
  )

  const addNewTable = useCallback(async () => {
    const envId = activeEnvironmentId || null

    if (!envId) {
      const msg =
        "No hay ambientes disponibles. Debe existir al menos una mesa o un ambiente en el sistema para crear otra."
      toast.error("Sin ambiente", { description: msg })
      setSaveBanner({ kind: "error", message: msg })
      return
    }

    const nextNum = tables.filter((t) => t.environmentId === envId).length + 1
    const name = `Mesa ${nextNum}`

    try {
      const created = await createAdminTable({
        environmentId: envId,
        name,
        capacity: 4,
      })
      const ui = adminTableToUi(created)
      setTables((prev) => [...prev, ui])
      setSelectedTableId(ui.id)
      const desc = `Se creó ${ui.name}`
      toast.success("Mesa creada", { description: desc })
      setSaveBanner({ kind: "success", message: desc })
    } catch (e) {
      const msg = apiErrorMessage(e, "No se pudo crear la mesa.")
      toast.error("Error al crear mesa", { description: msg })
      setSaveBanner({ kind: "error", message: msg })
    }
  }, [activeEnvironmentId, tables])

  const saveLayout = useCallback(async () => {
    const toSave = tables.filter((t) => t.environmentId === activeEnvironmentId)
    if (toSave.length === 0) return

    setSavingLayout(true)
    setSaveBanner(null)
    const loadingId = toast.loading("Guardando layout…", {
      description: `Sincronizando ${toSave.length} ${toSave.length === 1 ? "mesa" : "mesas"} del ambiente actual.`,
    })
    try {
      await Promise.all(
        toSave.map((t) => patchAdminTable(t.id, uiTableToPatch(t))),
      )
      toast.dismiss(loadingId)
      const desc = `Se actualizaron ${toSave.length} ${toSave.length === 1 ? "mesa" : "mesas"} en este ambiente.`
      toast.success("Layout guardado", { description: desc })
      setSaveBanner({ kind: "success", message: desc })
      await loadTables()
    } catch (e) {
      toast.dismiss(loadingId)
      const msg = apiErrorMessage(e, "No se pudo guardar el layout de este ambiente.")
      toast.error("Error al guardar layout", { description: msg })
      setSaveBanner({ kind: "error", message: msg })
    } finally {
      setSavingLayout(false)
    }
  }, [tables, activeEnvironmentId, loadTables])

  const saveSelectedProperties = useCallback(async () => {
    if (!selectedTable) return
    setSavingProperties(true)
    setSaveBanner(null)
    const loadingId = toast.loading("Guardando mesa…", {
      description: selectedTable.name,
    })
    try {
      const updated = await patchAdminTable(selectedTable.id, uiTableToPatch(selectedTable))
      setTables((prev) =>
        prev.map((t) => (t.id === updated.id ? adminTableToUi(updated) : t)),
      )
      toast.dismiss(loadingId)
      const desc = `${updated.name} se actualizó correctamente.`
      toast.success("Cambios guardados", { description: desc })
      setSaveBanner({ kind: "success", message: desc })
    } catch (e) {
      toast.dismiss(loadingId)
      const msg = apiErrorMessage(e, "No se pudo actualizar la mesa.")
      toast.error("Error al guardar la mesa", { description: msg })
      setSaveBanner({ kind: "error", message: msg })
    } finally {
      setSavingProperties(false)
    }
  }, [selectedTable])

  const deleteSelectedTable = useCallback(async () => {
    if (!selectedTable) return
    const id = selectedTable.id
    const name = selectedTable.name
    setDeletingTable(true)
    setSaveBanner(null)
    const loadingId = toast.loading("Eliminando mesa…", { description: name })
    try {
      await deleteAdminTable(id)
      setTables((prev) => prev.filter((t) => t.id !== id))
      setSelectedTableId(null)
      toast.dismiss(loadingId)
      const desc = `Se eliminó ${name}.`
      toast.success("Mesa eliminada", { description: desc })
      setSaveBanner({ kind: "success", message: desc })
    } catch (e) {
      toast.dismiss(loadingId)
      const msg = apiErrorMessage(e, "No se pudo eliminar la mesa.")
      toast.error("Error al eliminar", { description: msg })
      setSaveBanner({ kind: "error", message: msg })
    } finally {
      setDeletingTable(false)
    }
  }, [selectedTable])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mesas</h1>
          <p className="text-muted-foreground">
            Cada ambiente tiene un plano independiente: elegí uno en el selector. Las
            reservas del día se sincronizan con el listado de reservas y se muestran sobre
            la mesa con el horario. Mové las mesas y pulsá{" "}
            <span className="font-medium text-foreground">Guardar layout</span> para
            persistir solo este ambiente. Los datos de cada mesa se confirman con{" "}
            <span className="font-medium text-foreground">Guardar cambios</span>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => void addNewTable()}
            disabled={savingLayout || savingProperties || deletingTable}
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar mesa
          </Button>
          <Button
            title="Envía posición, forma y rotación de las mesas de este ambiente"
            onClick={() => void saveLayout()}
            disabled={
              savingLayout ||
              savingProperties ||
              deletingTable ||
              tablesInActiveEnvironment.length === 0
            }
          >
            {savingLayout ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {savingLayout ? "Guardando…" : "Guardar layout"}
          </Button>
        </div>
      </div>

      {loadError ? (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            {loadError}
            <Button variant="outline" size="sm" className="w-fit" onClick={() => void loadTables()}>
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {saveBanner ? (
        <Alert
          variant={saveBanner.kind === "error" ? "destructive" : "default"}
          className={
            saveBanner.kind === "success"
              ? "border-emerald-500/40 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/25 dark:text-emerald-50"
              : undefined
          }
        >
          <div className="flex w-full items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1">
              <AlertTitle>
                {saveBanner.kind === "success" ? "Operación correcta" : "Algo salió mal"}
              </AlertTitle>
              <AlertDescription className="text-pretty">
                {saveBanner.message}
              </AlertDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              onClick={() => setSaveBanner(null)}
              aria-label="Cerrar aviso"
            >
              <X className="size-4" />
            </Button>
          </div>
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="environment-filter" className="text-sm font-medium">
            Ambiente:
          </Label>
          <Select
            value={activeEnvironmentId || ""}
            onValueChange={setSelectedEnvironmentId}
            disabled={environmentOptions.length === 0}
          >
            <SelectTrigger id="environment-filter" className="w-[220px]">
              <SelectValue
                placeholder={environmentOptions.length === 0 ? "Sin ambientes" : undefined}
              />
            </SelectTrigger>
            <SelectContent>
              {environmentOptions.map((env) => (
                <SelectItem key={env.id} value={env.id}>
                  {env.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {reservationsLoading ? (
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            Actualizando reservas del día…
          </span>
        ) : null}
        {reservationsError ? (
          <div className="flex max-w-md flex-col gap-1 text-xs text-destructive sm:flex-row sm:items-center sm:gap-2">
            <span className="text-pretty">{reservationsError}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 w-fit shrink-0"
              onClick={() => void loadReservationsMap()}
            >
              Reintentar
            </Button>
          </div>
        ) : null}
      </div>

      <div className="flex gap-6">
        <div className="flex-1">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div
                ref={canvasRef}
                className={cn(
                  "relative h-[600px] cursor-crosshair select-none overflow-hidden",
                  "bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)]",
                  "bg-[size:20px_20px]",
                )}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={handleCanvasClick}
              >
                {tablesInActiveEnvironment.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
                    <Square className="h-12 w-12 opacity-40" />
                    <p className="text-sm">No hay mesas en este ambiente</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void addNewTable()}
                      disabled={savingLayout || savingProperties || deletingTable}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar primera mesa
                    </Button>
                  </div>
                ) : (
                  tablesInActiveEnvironment.map((table) => (
                    <TableElement
                      key={table.id}
                      table={table}
                      reservationSlots={reservationByTableId.get(table.id)}
                      isSelected={selectedTableId === table.id}
                      onMouseDown={(e) => handleMouseDown(e, table.id)}
                    />
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <div className="mt-4 flex flex-wrap items-center gap-6">
            <span className="text-sm font-medium text-muted-foreground">Leyenda:</span>
            {Object.entries(statusColors).map(([key, color]) => (
              <div key={key} className="flex items-center gap-2">
                <div className={cn("h-3 w-3 rounded-full", color)} />
                <span className="text-sm text-muted-foreground">
                  {statusLabels[key as keyof typeof statusLabels]}
                </span>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <div
                className="box-border h-3 w-3 rounded-full border-2 border-amber-400 bg-emerald-500"
                title="Mesa activa con reserva"
              />
              <span className="text-sm text-muted-foreground">Con reserva hoy</span>
            </div>
          </div>
        </div>

        {selectedTable && (
          <Card className="w-[320px] shrink-0">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Move className="h-4 w-4" />
                Propiedades de la mesa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Ambiente</Label>
                <p className="text-sm text-muted-foreground">{selectedTable.environmentName}</p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CalendarClock className="size-4" />
                  Reservas hoy
                </Label>
                {selectedReservationSlots?.length ? (
                  <ul className="space-y-2 text-sm">
                    {selectedReservationSlots.map((slot) => (
                      <li
                        key={slot.reservationId}
                        className="rounded-md border bg-muted/40 px-3 py-2"
                      >
                        <p className="font-medium tabular-nums">{slot.timeRangeLabel}</p>
                        <p className="text-muted-foreground">{slot.customerLabel}</p>
                        <p className="text-xs text-muted-foreground">Estado: {slot.status}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Sin reservas activas asignadas a esta mesa para hoy.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="table-name">Nombre</Label>
                <Input
                  id="table-name"
                  value={selectedTable.name}
                  onChange={(e) => updateSelectedTable({ name: e.target.value })}
                  placeholder="Ej: Mesa 1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="table-capacity">Capacidad</Label>
                <Input
                  id="table-capacity"
                  type="number"
                  min={1}
                  max={99}
                  value={selectedTable.capacity}
                  onChange={(e) =>
                    updateSelectedTable({ capacity: parseInt(e.target.value, 10) || 1 })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="table-shape">Forma</Label>
                <Select
                  value={selectedTable.shape}
                  onValueChange={(value: "circle" | "rect") =>
                    updateSelectedTable({
                      shape: value,
                      width: value === "rect" ? 100 : undefined,
                      height: value === "rect" ? 60 : undefined,
                    })
                  }
                >
                  <SelectTrigger id="table-shape">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="circle">
                      <span className="flex items-center gap-2">
                        <Circle className="h-4 w-4" />
                        Circular
                      </span>
                    </SelectItem>
                    <SelectItem value="rect">
                      <span className="flex items-center gap-2">
                        <Square className="h-4 w-4" />
                        Rectangular
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedTable.shape === "rect" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="table-width">Ancho</Label>
                    <Input
                      id="table-width"
                      type="number"
                      min={40}
                      max={400}
                      value={selectedTable.width ?? 100}
                      onChange={(e) =>
                        updateSelectedTable({ width: parseInt(e.target.value, 10) || 100 })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="table-height">Alto</Label>
                    <Input
                      id="table-height"
                      type="number"
                      min={40}
                      max={300}
                      value={selectedTable.height ?? 60}
                      onChange={(e) =>
                        updateSelectedTable({ height: parseInt(e.target.value, 10) || 60 })
                      }
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="table-active">Estado</Label>
                <Select
                  value={selectedTable.isActive ? "active" : "inactive"}
                  onValueChange={(value) =>
                    updateSelectedTable({ isActive: value === "active" })
                  }
                >
                  <SelectTrigger id="table-active">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">
                      <span className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        Activa
                      </span>
                    </SelectItem>
                    <SelectItem value="inactive">
                      <span className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-gray-400" />
                        Inactiva
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full"
                onClick={() => void saveSelectedProperties()}
                disabled={savingLayout || savingProperties || deletingTable}
              >
                {savingProperties ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {savingProperties ? "Guardando…" : "Guardar cambios"}
              </Button>

              <Button
                variant="destructive"
                className="w-full"
                onClick={() => void deleteSelectedTable()}
                disabled={savingLayout || savingProperties || deletingTable}
              >
                {deletingTable ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                {deletingTable ? "Eliminando…" : "Eliminar mesa"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function TableElement({
  table,
  reservationSlots,
  isSelected,
  onMouseDown,
}: {
  table: UiTable
  reservationSlots?: TableReservationSlot[]
  isSelected: boolean
  onMouseDown: (e: React.MouseEvent) => void
}) {
  const colorKey = table.isActive ? "active" : "inactive"
  const hasReservation = Boolean(reservationSlots?.length)
  const baseClasses = cn(
    "absolute flex cursor-move flex-col items-center justify-center border-2 transition-shadow",
    statusColors[colorKey],
    isSelected && "z-10 ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg",
    !isSelected &&
      hasReservation &&
      "ring-2 ring-amber-400 ring-offset-2 ring-offset-background shadow-md",
    !isSelected && !hasReservation && "hover:shadow-md",
  )

  const size = table.shape === "circle" ? 64 : undefined
  const width = table.shape === "rect" ? (table.width ?? 100) : size
  const height = table.shape === "rect" ? (table.height ?? 60) : size

  const firstSlot = reservationSlots?.[0]

  return (
    <div
      className={cn(baseClasses, table.shape === "circle" ? "rounded-full" : "rounded-lg")}
      style={{
        left: table.x,
        top: table.y,
        width,
        height,
        transform: table.rotation ? `rotate(${table.rotation}deg)` : undefined,
      }}
      onMouseDown={onMouseDown}
    >
      <span className="text-center text-sm font-bold text-white drop-shadow-sm">
        {table.name}
      </span>
      {firstSlot ? (
        <span
          className="mt-0.5 line-clamp-2 max-w-[95%] text-center text-[10px] font-medium leading-tight text-white drop-shadow"
          title={reservationSlots?.map((s) => s.timeRangeLabel).join(" · ")}
        >
          {firstSlot.timeRangeLabel}
          {reservationSlots && reservationSlots.length > 1
            ? ` (+${reservationSlots.length - 1})`
            : ""}
        </span>
      ) : null}
      <span className="flex items-center gap-0.5 text-xs text-white/90">
        <Users className="h-3 w-3" />
        {table.capacity}
      </span>
    </div>
  )
}
