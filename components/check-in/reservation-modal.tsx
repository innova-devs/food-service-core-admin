"use client"

import { useState } from "react"
import {
  CalendarIcon,
  ClockIcon,
  MinusIcon,
  PlusIcon,
  UserIcon,
  UsersIcon,
  CheckCircleIcon,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export interface ReservationData {
  id: string
  customerName: string
  customerPhone?: string
  date: Date
  time: string
  totalGuests: number
  checkedInGuests: number
  status: "pending" | "confirmed" | "checked_in" | "completed" | "cancelled"
  tableNumber?: string
  notes?: string
}

interface ReservationModalProps {
  reservation: ReservationData | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirmCheckIn: (reservationId: string, arrivedGuests: number) => void
  isConfirming?: boolean
}

export function ReservationModal({
  reservation,
  open,
  onOpenChange,
  onConfirmCheckIn,
  isConfirming = false,
}: ReservationModalProps) {
  const [arrivedGuests, setArrivedGuests] = useState(1)

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setArrivedGuests(1)
    }
    onOpenChange(newOpen)
  }

  const handleConfirm = () => {
    if (reservation) {
      onConfirmCheckIn(reservation.id, arrivedGuests)
    }
  }

  const incrementGuests = () => {
    if (reservation && arrivedGuests < reservation.totalGuests - reservation.checkedInGuests) {
      setArrivedGuests((prev) => prev + 1)
    }
  }

  const decrementGuests = () => {
    if (arrivedGuests > 1) {
      setArrivedGuests((prev) => prev - 1)
    }
  }

  if (!reservation) return null

  const remainingGuests = reservation.totalGuests - reservation.checkedInGuests
  const isFullyCheckedIn = remainingGuests === 0

  const statusLabels: Record<string, string> = {
    pending: "Pendiente",
    confirmed: "Confirmada",
    checked_in: "En proceso",
    completed: "Completada",
    cancelled: "Cancelada",
  }

  const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    pending: "outline",
    confirmed: "secondary",
    checked_in: "default",
    completed: "default",
    cancelled: "destructive",
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-primary" />
            Check-in de reserva
          </DialogTitle>
          <DialogDescription>
            Confirma la llegada de los invitados
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Customer Info */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <UserIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold">{reservation.customerName}</p>
                {reservation.customerPhone && (
                  <p className="text-sm text-muted-foreground">
                    {reservation.customerPhone}
                  </p>
                )}
              </div>
            </div>
            <Badge variant={statusVariants[reservation.status]}>
              {statusLabels[reservation.status]}
            </Badge>
          </div>

          <Separator />

          {/* Reservation Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Fecha</p>
                <p className="text-sm font-medium">
                  {format(reservation.date, "d MMM yyyy", { locale: es })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Hora</p>
                <p className="text-sm font-medium">{reservation.time}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Total invitados</p>
                <p className="text-sm font-medium">{reservation.totalGuests}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Ya llegaron</p>
                <p className="text-sm font-medium">{reservation.checkedInGuests}</p>
              </div>
            </div>
          </div>

          {reservation.tableNumber && (
            <>
              <Separator />
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">Mesa asignada</p>
                <p className="font-semibold">Mesa {reservation.tableNumber}</p>
              </div>
            </>
          )}

          {reservation.notes && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">Notas</p>
              <p className="text-sm">{reservation.notes}</p>
            </div>
          )}

          <Separator />

          {/* Guest Counter */}
          {isFullyCheckedIn ? (
            <div className="rounded-lg bg-primary/10 p-4 text-center">
              <CheckCircleIcon className="mx-auto h-8 w-8 text-primary" />
              <p className="mt-2 font-medium">Todos los invitados han llegado</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-lg border p-4">
              <p className="text-sm font-medium">Invitados que llegan ahora</p>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={decrementGuests}
                  disabled={arrivedGuests <= 1 || isConfirming}
                >
                  <MinusIcon className="h-4 w-4" />
                </Button>
                <span className="min-w-[3rem] text-center text-3xl font-bold">
                  {arrivedGuests}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={incrementGuests}
                  disabled={arrivedGuests >= remainingGuests || isConfirming}
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                de {remainingGuests} invitado{remainingGuests !== 1 ? "s" : ""} pendiente
                {remainingGuests !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isConfirming}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          {!isFullyCheckedIn && (
            <Button
              onClick={handleConfirm}
              disabled={isConfirming}
              className="w-full sm:w-auto"
            >
              {isConfirming ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Confirmando...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4" />
                  Confirmar check-in
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
