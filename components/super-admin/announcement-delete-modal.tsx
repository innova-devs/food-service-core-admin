"use client"

import { Loader2, Trash2 } from "lucide-react"
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
import type { Announcement } from "./announcement-types"

interface AnnouncementDeleteModalProps {
  announcement: Announcement | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
  isDeleting: boolean
}

export function AnnouncementDeleteModal({
  announcement,
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
}: AnnouncementDeleteModalProps) {
  if (!announcement) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar anuncio</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de que querés eliminar el anuncio{" "}
            <strong>&ldquo;{announcement.title}&rdquo;</strong>?
            <br />
            Esta acción lo desactivará y no podrá deshacerse.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-white hover:bg-destructive/90"
            disabled={isDeleting}
            onClick={(e) => {
              e.preventDefault()
              void onConfirm()
            }}
          >
            {isDeleting ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 size-4" />
            )}
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
