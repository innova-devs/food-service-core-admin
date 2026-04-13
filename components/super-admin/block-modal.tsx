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
import type { BusinessWithSubscription, BusinessStatus } from "./types"

interface BlockModalProps {
  business: BusinessWithSubscription | null
  status: BusinessStatus
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function BlockModal({
  business,
  status,
  open,
  onOpenChange,
  onConfirm,
}: BlockModalProps) {
  const isBlocked = status === "Blocked"

  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isBlocked ? "Desbloquear negocio" : "Bloquear negocio"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isBlocked
              ? `¿Seguro que querés desbloquear a ${business?.name}? Se restaurará el acceso a la IA.`
              : `¿Seguro que querés bloquear a ${business?.name}? Se desactivará de inmediato el acceso a la IA.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            {isBlocked ? "Desbloquear" : "Bloquear"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
