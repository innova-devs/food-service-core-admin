"use client"

import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const SETTINGS_UNSAVED_MESSAGE =
  "Modificaste la configuración. Guardá los cambios para que se apliquen en tu negocio."

export const BUSINESS_UNSAVED_MESSAGE =
  "Modificaste los datos del negocio. Guardá los cambios para que se apliquen."

interface SettingsFormFooterProps {
  isDirty: boolean
  isSaving: boolean
  onSave: () => void
  onCancel: () => void
  dirtyMessage?: string
  saveLabel?: string
  onResetDefaults?: () => void
  isResetting?: boolean
}

export function SettingsFormFooter({
  isDirty,
  isSaving,
  onSave,
  onCancel,
  dirtyMessage = SETTINGS_UNSAVED_MESSAGE,
  saveLabel = "Guardar cambios",
  onResetDefaults,
  isResetting = false,
}: SettingsFormFooterProps) {
  const showReset = Boolean(onResetDefaults)

  return (
    <div
      className={cn(
        "fixed bottom-0 z-30 border-t bg-background shadow-[0_-4px_24px_rgba(0,0,0,0.06)]",
        "left-0 right-0 md:left-[var(--sidebar-width)]",
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center md:px-6",
          isDirty ? "sm:justify-between" : "sm:justify-end",
        )}
      >
        {isDirty ? (
          <p className="min-w-0 flex-1 text-sm text-foreground sm:pr-4">
            {dirtyMessage}
          </p>
        ) : null}

        <div className="flex shrink-0 flex-nowrap items-center justify-end gap-2 sm:gap-3">
          {showReset ? (
            <Button
              type="button"
              variant="destructive"
              onClick={onResetDefaults}
              disabled={isSaving || isResetting}
              className="shrink-0"
            >
              {isResetting ? <Loader2 className="size-4 animate-spin" /> : null}
              Restaurar defaults
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSaving || isResetting || !isDirty}
            className="shrink-0"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onSave}
            disabled={isSaving || isResetting || !isDirty}
            className="shrink-0"
          >
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
            {saveLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
