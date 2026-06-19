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
  onResetDefaults?: () => void
  isResetting?: boolean
}

export function SettingsFormFooter({
  isDirty,
  isSaving,
  onSave,
  onCancel,
  dirtyMessage = SETTINGS_UNSAVED_MESSAGE,
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
          "mx-auto flex w-full max-w-none flex-col gap-3 px-4 py-3 md:px-6",
          isDirty
            ? "md:flex-row md:items-center md:justify-between"
            : "md:flex-row md:items-center md:justify-end",
        )}
      >
        {isDirty ? (
          <p className="text-sm text-foreground">{dirtyMessage}</p>
        ) : null}

        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          {showReset ? (
            <Button
              type="button"
              variant="destructive"
              onClick={onResetDefaults}
              disabled={isSaving || isResetting}
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
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onSave}
            disabled={isSaving || isResetting || !isDirty}
          >
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
            Guardar cambios
          </Button>
        </div>
      </div>
    </div>
  )
}
