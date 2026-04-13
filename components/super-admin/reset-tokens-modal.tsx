"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertTriangle } from "lucide-react"
import type { BusinessWithSubscription } from "./types"
import { formatTokens } from "./types"

interface ResetTokensModalProps {
  business: BusinessWithSubscription | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function ResetTokensModal({
  business,
  open,
  onOpenChange,
  onConfirm,
}: ResetTokensModalProps) {
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950">
              <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400" />
            </div>
            <AlertDialogTitle>Reiniciar tokens</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            ¿Seguro que querés reiniciar el uso de tokens de {business?.name}?
            El uso actual de{" "}
            <span className="font-medium text-foreground">
              {formatTokens(business?.ai_monthly_tokens_used || 0)}
            </span>{" "}
            tokens volverá a 0.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            Reiniciar tokens
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
