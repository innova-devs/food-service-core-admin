"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { isAxiosError } from "axios"
import { toast } from "sonner"
import { ArrowRightLeft, Clock3, Loader2, Moon, Plus, Save, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import {
  createAdminBusinessHour,
  fetchAdminBusinessHourById,
  deleteAdminBusinessHour,
  fetchAdminBusinessHours,
  patchAdminBusinessHour,
  type AdminBusinessHour,
} from "@/lib/requests/business-hours"

const DAYS = [
  { value: 0, label: "Domingo", short: "Dom" },
  { value: 1, label: "Lunes", short: "Lun" },
  { value: 2, label: "Martes", short: "Mar" },
  { value: 3, label: "Miércoles", short: "Mié" },
  { value: 4, label: "Jueves", short: "Jue" },
  { value: 5, label: "Viernes", short: "Vie" },
  { value: 6, label: "Sábado", short: "Sáb" },
] as const

function errorMessage(err: unknown, fallback: string): string {
  if (!isAxiosError(err)) return fallback
  const data = err.response?.data as { message?: string; error?: string } | undefined
  return data?.message ?? data?.error ?? err.message ?? fallback
}

function normalizeTime(input: string, fallback: string): string {
  if (!input) return fallback
  const trimmed = input.trim()
  if (/^\d{2}:\d{2}$/.test(trimmed)) return trimmed
  return fallback
}

function timeToMinutes(v: string): number | null {
  const m = /^(\d{2}):(\d{2})$/.exec(v)
  if (!m) return null
  const hh = Number(m[1])
  const mm = Number(m[2])
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null
  return hh * 60 + mm
}

function isValidShiftRange(opensAt: string, closesAt: string): boolean {
  const from = timeToMinutes(opensAt)
  const to = timeToMinutes(closesAt)
  if (from == null || to == null) return false
  return from < to
}

export default function HoursPage() {
  const [hours, setHours] = useState<AdminBusinessHour[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [copyFromDay, setCopyFromDay] = useState("1")
  const [copyTargets, setCopyTargets] = useState<number[]>([])

  const loadHours = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchAdminBusinessHours()
      setHours(data)
    } catch (err) {
      toast.error(errorMessage(err, "No se pudieron cargar los horarios"))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadHours()
  }, [loadHours])

  const grouped = useMemo(() => {
    return DAYS.map((day) => {
      const rows = hours
        .filter((h) => h.dayOfWeek === day.value)
        .sort((a, b) => a.opensAt.localeCompare(b.opensAt))
      return {
        ...day,
        rows,
        isClosed: rows.length > 0 && rows.every((row) => row.isClosed),
      }
    })
  }, [hours])

  const weekSummary = useMemo(
    () =>
      grouped.map((day) => {
        if (day.rows.length === 0) return `${day.short}: sin turnos`
        if (day.isClosed) return `${day.short}: cerrado`
        const first = day.rows[0]
        const last = day.rows[day.rows.length - 1]
        const extra = day.rows.length > 1 ? ` (+${day.rows.length - 1})` : ""
        return `${day.short}: ${first.opensAt} - ${last.closesAt}${extra}`
      }),
    [grouped],
  )

  const handleAddShift = async (dayOfWeek: number) => {
    setSaving(true)
    try {
      const created = await createAdminBusinessHour({
        dayOfWeek,
        opensAt: "09:00",
        closesAt: "18:00",
        isClosed: false,
      })
      setHours((prev) => [...prev, created])
      toast.success("Turno agregado")
    } catch (err) {
      toast.error(errorMessage(err, "No se pudo agregar el turno"))
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateShift = async (
    row: AdminBusinessHour,
    changes: Partial<Pick<AdminBusinessHour, "opensAt" | "closesAt" | "isClosed">>,
  ) => {
    const nextOpen = changes.opensAt ?? row.opensAt
    const nextClose = changes.closesAt ?? row.closesAt
    const nextClosed = changes.isClosed ?? row.isClosed
    if (!nextClosed && !isValidShiftRange(nextOpen, nextClose)) {
      toast.error("Rango inválido: la hora de apertura debe ser menor a la de cierre")
      return
    }

    setBusyId(row.id)
    try {
      await patchAdminBusinessHour(row.id, {
        opensAt: changes.opensAt,
        closesAt: changes.closesAt,
        isClosed: changes.isClosed,
      })
      const updated = await fetchAdminBusinessHourById(row.id)
      setHours((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      toast.success("Horario actualizado")
    } catch (err) {
      toast.error(errorMessage(err, "No se pudo actualizar el horario"))
    } finally {
      setBusyId(null)
    }
  }

  const handleDeleteShift = async (id: string) => {
    setBusyId(id)
    try {
      await deleteAdminBusinessHour(id)
      setHours((prev) => prev.filter((h) => h.id !== id))
      toast.success("Turno eliminado")
    } catch (err) {
      toast.error(errorMessage(err, "No se pudo eliminar el turno"))
    } finally {
      setBusyId(null)
    }
  }

  const handleToggleDayClosed = async (
    day: (typeof grouped)[number],
    nextIsClosed: boolean,
  ) => {
    setSaving(true)
    try {
      if (day.rows.length === 0) {
        const created = await createAdminBusinessHour({
          dayOfWeek: day.value,
          opensAt: "00:00",
          closesAt: "00:00",
          isClosed: nextIsClosed,
        })
        setHours((prev) => [...prev, created])
      } else {
        const updates = await Promise.all(
          day.rows.map((row) =>
            patchAdminBusinessHour(row.id, {
              isClosed: nextIsClosed,
              opensAt: nextIsClosed ? "00:00" : row.opensAt === "00:00" ? "09:00" : row.opensAt,
              closesAt: nextIsClosed
                ? "00:00"
                : row.closesAt === "00:00"
                  ? "18:00"
                  : row.closesAt,
            }),
          ),
        )
        setHours((prev) =>
          prev.map((row) => updates.find((u) => u.id === row.id) ?? row),
        )
      }
      toast.success(nextIsClosed ? `Marcaste ${day.label} como cerrado` : `${day.label} habilitado`)
    } catch (err) {
      toast.error(errorMessage(err, "No se pudo cambiar el estado del día"))
    } finally {
      setSaving(false)
    }
  }

  const toggleCopyTarget = (day: number, checked: boolean) => {
    setCopyTargets((prev) =>
      checked ? Array.from(new Set([...prev, day])) : prev.filter((d) => d !== day),
    )
  }

  const handleCopySchedule = async () => {
    const sourceDay = Number(copyFromDay)
    const sourceRows = hours.filter((h) => h.dayOfWeek === sourceDay)
    const targets = copyTargets.filter((d) => d !== sourceDay)

    if (sourceRows.length === 0) {
      toast.info("El día de origen no tiene turnos para copiar")
      return
    }
    if (targets.length === 0) {
      toast.info("Seleccioná al menos un día de destino")
      return
    }

    setSaving(true)
    try {
      for (const day of targets) {
        const current = hours.filter((h) => h.dayOfWeek === day)
        for (const row of current) {
          await deleteAdminBusinessHour(row.id)
        }
        for (const source of sourceRows) {
          await createAdminBusinessHour({
            dayOfWeek: day,
            opensAt: source.opensAt,
            closesAt: source.closesAt,
            isClosed: source.isClosed,
          })
        }
      }
      await loadHours()
      toast.success("Horarios copiados correctamente")
    } catch (err) {
      toast.error(errorMessage(err, "No se pudieron copiar los horarios"))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Horarios</h1>
          <p className="text-muted-foreground">
            Configurá turnos por día para definir apertura y cierre del negocio.
          </p>
        </div>
        <Button variant="outline" onClick={() => void loadHours()} disabled={saving}>
          {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          Recargar
        </Button>
      </div>

      <Card className="border-border/70 bg-gradient-to-br from-background to-muted/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Resumen semanal compacto</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm md:grid-cols-2 xl:grid-cols-4">
          {weekSummary.map((row) => (
            <div key={row} className="rounded-md border bg-background/80 px-3 py-2">
              {row}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-gradient-to-br from-background to-muted/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ArrowRightLeft className="size-4 text-primary" />
            Copiar horarios a otros días
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="w-full max-w-[260px] space-y-2">
              <Label>Día de origen</Label>
              <Select value={copyFromDay} onValueChange={setCopyFromDay} disabled={saving}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => (
                    <SelectItem key={d.value} value={String(d.value)}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => void handleCopySchedule()} disabled={saving}>
              {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Copiar horarios
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {DAYS.map((day) => (
              <label
                key={day.value}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                  Number(copyFromDay) === day.value && "opacity-50",
                )}
              >
                <Checkbox
                  checked={copyTargets.includes(day.value)}
                  onCheckedChange={(checked) => toggleCopyTarget(day.value, checked === true)}
                  disabled={saving || Number(copyFromDay) === day.value}
                />
                {day.label}
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {grouped.map((day) => (
          <Card
            key={day.value}
            className={cn(
              "overflow-hidden border-border/70 bg-gradient-to-b from-background to-muted/30",
              day.isClosed && "opacity-85",
            )}
          >
            <CardHeader className="space-y-3 pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock3 className="size-4 text-primary" />
                  {day.label}
                </CardTitle>
                <Badge variant={day.isClosed ? "secondary" : "default"}>
                  {day.isClosed ? "Cerrado" : "Abierto"}
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/80 px-3 py-2">
                <Label htmlFor={`closed-${day.value}`} className="text-sm">
                  Cerrar todo el día
                </Label>
                <Switch
                  id={`closed-${day.value}`}
                  checked={day.isClosed}
                  onCheckedChange={(checked) => void handleToggleDayClosed(day, checked)}
                  disabled={saving}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {day.rows.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Sin turnos cargados para {day.short}.
                </div>
              ) : (
                day.rows.map((row) => (
                  <ShiftRow
                    key={row.id}
                    row={row}
                    busy={busyId === row.id || saving}
                    onSave={(next) => void handleUpdateShift(row, next)}
                    onDelete={() => void handleDeleteShift(row.id)}
                  />
                ))
              )}

              <Button
                className="w-full"
                variant="outline"
                onClick={() => void handleAddShift(day.value)}
                disabled={saving || day.isClosed}
              >
                <Plus className="mr-2 size-4" />
                Agregar turno
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function ShiftRow({
  row,
  busy,
  onSave,
  onDelete,
}: {
  row: AdminBusinessHour
  busy: boolean
  onSave: (next: { opensAt: string; closesAt: string; isClosed: boolean }) => void
  onDelete: () => void
}) {
  const [opensAt, setOpensAt] = useState(row.opensAt)
  const [closesAt, setClosesAt] = useState(row.closesAt)

  useEffect(() => {
    setOpensAt(row.opensAt)
    setClosesAt(row.closesAt)
  }, [row.opensAt, row.closesAt, row.id])

  const dirty = opensAt !== row.opensAt || closesAt !== row.closesAt
  const invalidRange = !row.isClosed && !isValidShiftRange(opensAt, closesAt)

  return (
    <div className="rounded-xl border border-border/60 bg-background/90 p-3 shadow-sm">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Abre</Label>
          <Input
            type="time"
            value={opensAt}
            disabled={busy || row.isClosed}
            onChange={(e) => setOpensAt(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Cierra</Label>
          <Input
            type="time"
            value={closesAt}
            disabled={busy || row.isClosed}
            onChange={(e) => setClosesAt(e.target.value)}
          />
        </div>
      </div>
      {invalidRange ? (
        <p className="mt-2 text-xs text-destructive">
          Rango inválido: apertura debe ser menor que cierre.
        </p>
      ) : null}
      <div className="mt-3 flex items-center gap-2">
        <Button
          size="sm"
          className="flex-1"
          disabled={busy || !dirty || row.isClosed || invalidRange}
          onClick={() =>
            onSave({
              opensAt: normalizeTime(opensAt, row.opensAt),
              closesAt: normalizeTime(closesAt, row.closesAt),
              isClosed: row.isClosed,
            })
          }
        >
          {busy ? <Loader2 className="mr-2 size-3.5 animate-spin" /> : <Save className="mr-2 size-3.5" />}
          Guardar
        </Button>
        <Button size="sm" variant="destructive" disabled={busy} onClick={onDelete}>
          <Trash2 className="size-3.5" />
        </Button>
        {row.isClosed ? (
          <span className="ml-auto inline-flex items-center text-xs text-muted-foreground">
            <Moon className="mr-1 size-3.5" />
            Día cerrado
          </span>
        ) : null}
      </div>
    </div>
  )
}
