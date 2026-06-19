"use client"

import { Loader2, Plus, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const TABLES_LAYOUT_UNSAVED_MESSAGE =
  "Modificaste el plano de mesas. Guardá el layout para que los cambios se apliquen."

const statusColors = {
  active: "bg-emerald-500",
  inactive: "bg-gray-400",
} as const

const statusLabels = {
  active: "Activa",
  inactive: "Inactiva",
} as const

function TablesLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <span className="text-sm font-medium text-muted-foreground">Leyenda:</span>
      {Object.entries(statusColors).map(([key, color]) => (
        <div key={key} className="flex items-center gap-2">
          <div className={cn("size-3 rounded-full", color)} />
          <span className="text-sm text-muted-foreground">
            {statusLabels[key as keyof typeof statusLabels]}
          </span>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <div
          className="box-border size-3 rounded-full border-2 border-amber-400 bg-emerald-500"
          title="Mesa activa con reserva"
        />
        <span className="text-sm text-muted-foreground">Con reserva hoy</span>
      </div>
    </div>
  )
}

interface TablesLayoutFooterProps {
  isLayoutDirty: boolean
  savingLayout: boolean
  savingProperties: boolean
  deletingTable: boolean
  hasEnvironments: boolean
  canSaveLayout: boolean
  onAddTable: () => void
  onSaveLayout: () => void
}

export function TablesLayoutFooter({
  isLayoutDirty,
  savingLayout,
  savingProperties,
  deletingTable,
  hasEnvironments,
  canSaveLayout,
  onAddTable,
  onSaveLayout,
}: TablesLayoutFooterProps) {
  const actionsDisabled = savingLayout || savingProperties || deletingTable

  return (
    <div
      className={cn(
        "fixed bottom-0 z-30 border-t bg-background shadow-[0_-4px_24px_rgba(0,0,0,0.06)]",
        "left-0 right-0 md:left-[var(--sidebar-width)]",
      )}
    >
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:px-6">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <TablesLegend />
          {isLayoutDirty ? (
            <p className="text-sm text-foreground">{TABLES_LAYOUT_UNSAVED_MESSAGE}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onAddTable}
            disabled={actionsDisabled || !hasEnvironments}
            title={
              !hasEnvironments
                ? "Creá al menos un ambiente antes de agregar mesas"
                : undefined
            }
          >
            <Plus className="size-4" />
            Agregar mesa
          </Button>
          <Button
            type="button"
            title="Envía posición, forma y rotación de las mesas de este ambiente"
            onClick={onSaveLayout}
            disabled={actionsDisabled || !canSaveLayout || !isLayoutDirty}
          >
            {savingLayout ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {savingLayout ? "Guardando…" : "Guardar layout"}
          </Button>
        </div>
      </div>
    </div>
  )
}
