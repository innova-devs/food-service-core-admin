"use client"

import { Sparkles } from "lucide-react"

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

interface ConfirmAiGenerationDialogProps {
  open: boolean
  productName: string
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function ConfirmAiGenerationDialog({
  open,
  productName,
  onOpenChange,
  onConfirm,
}: ConfirmAiGenerationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950">
            <Sparkles className="size-5 text-violet-600 dark:text-violet-400" />
          </div>
          <AlertDialogTitle>Generar datos inteligentes</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2 text-left">
            <span className="block">
              <span className="font-medium text-foreground">{productName}</span>{" "}
              aún no tiene metadatos enriquecidos con IA.
            </span>
            <span className="block">
              Vamos a analizar el producto y generar automáticamente el nombre
              comercial, descripción corta, palabras clave y etiquetas para
              mejorar su visibilidad en búsquedas y en el menú digital.
            </span>
            <span className="block">
              Vas a poder revisar y editar todo antes de guardarlo.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-violet-600 text-white hover:bg-violet-700 dark:bg-violet-700 dark:hover:bg-violet-600"
          >
            Generar datos IA
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
