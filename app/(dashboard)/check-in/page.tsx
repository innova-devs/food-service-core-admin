"use client"

import { useState, useCallback } from "react"
import { AlertCircleIcon, QrCodeIcon, RotateCcwIcon } from "lucide-react"

import { CameraPermission } from "@/components/check-in/camera-permission"
import { QrScanner } from "@/components/check-in/qr-scanner"
import { ReservationModal, type ReservationData } from "@/components/check-in/reservation-modal"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type PermissionState = "prompt" | "granted" | "denied"

// Mock function to simulate fetching reservation data from QR code
async function fetchReservationFromQR(qrData: string): Promise<ReservationData> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // Simulate parsing QR data (in real app, this would be an API call)
  // QR data could be a reservation ID or encoded data
  const mockReservation: ReservationData = {
    id: qrData || "res-12345",
    customerName: "Juan Garcia",
    customerPhone: "+52 55 1234 5678",
    date: new Date(),
    time: "19:30",
    totalGuests: 4,
    checkedInGuests: 1,
    status: "confirmed",
    tableNumber: "15",
    notes: "Cumpleanos - solicita pastel con velas",
  }

  // Simulate random error for demo (uncomment to test error state)
  // if (Math.random() > 0.7) {
  //   throw new Error("Reserva no encontrada")
  // }

  return mockReservation
}

// Mock function to confirm check-in
async function confirmCheckIn(reservationId: string, arrivedGuests: number): Promise<void> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000))
  console.log(`Check-in confirmed: ${arrivedGuests} guests for reservation ${reservationId}`)
}

export default function CheckInPage() {
  const [permissionState, setPermissionState] = useState<PermissionState>("prompt")
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const [isRequestingPermission, setIsRequestingPermission] = useState(false)

  const [isProcessingQR, setIsProcessingQR] = useState(false)
  const [qrError, setQrError] = useState<string | null>(null)

  const [reservation, setReservation] = useState<ReservationData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)

  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const requestCameraPermission = useCallback(async () => {
    setIsRequestingPermission(true)
    setPermissionError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      // Stop the stream immediately, we just wanted to check permission
      stream.getTracks().forEach((track) => track.stop())
      setPermissionState("granted")
    } catch (error) {
      const err = error as Error
      setPermissionState("denied")
      if (err.name === "NotAllowedError") {
        setPermissionError(
          "Permiso de camara denegado. Por favor, habilita el acceso en la configuracion de tu navegador."
        )
      } else if (err.name === "NotFoundError") {
        setPermissionError("No se encontro una camara en este dispositivo.")
      } else {
        setPermissionError(err.message || "Error al acceder a la camara.")
      }
    } finally {
      setIsRequestingPermission(false)
    }
  }, [])

  const handleQRScan = useCallback(async (data: string) => {
    if (isProcessingQR) return

    setIsProcessingQR(true)
    setQrError(null)
    setSuccessMessage(null)

    try {
      const reservationData = await fetchReservationFromQR(data)
      setReservation(reservationData)
      setIsModalOpen(true)
    } catch (error) {
      const err = error as Error
      setQrError(err.message || "Error al procesar el codigo QR")
    } finally {
      setIsProcessingQR(false)
    }
  }, [isProcessingQR])

  const handleConfirmCheckIn = useCallback(
    async (reservationId: string, arrivedGuests: number) => {
      setIsConfirming(true)

      try {
        await confirmCheckIn(reservationId, arrivedGuests)
        setIsModalOpen(false)
        setReservation(null)
        setSuccessMessage(
          `Check-in confirmado: ${arrivedGuests} invitado${arrivedGuests !== 1 ? "s" : ""} registrado${arrivedGuests !== 1 ? "s" : ""}`
        )
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(null), 5000)
      } catch (error) {
        const err = error as Error
        setQrError(err.message || "Error al confirmar el check-in")
      } finally {
        setIsConfirming(false)
      }
    },
    []
  )

  const handleRetryPermission = useCallback(() => {
    setPermissionState("prompt")
    setPermissionError(null)
  }, [])

  const clearError = useCallback(() => {
    setQrError(null)
  }, [])

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <QrCodeIcon className="h-6 w-6" />
            Check-in de reservas
          </h1>
          <p className="text-muted-foreground">
            Escanea el codigo QR para registrar la llegada de los invitados
          </p>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <Alert className="border-primary/50 bg-primary/10">
          <AlertCircleIcon className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary">Exito</AlertTitle>
          <AlertDescription className="text-primary/90">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* QR Error */}
      {qrError && (
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{qrError}</span>
            <Button variant="outline" size="sm" onClick={clearError}>
              <RotateCcwIcon className="h-4 w-4" />
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      {permissionState === "prompt" || permissionState === "denied" ? (
        <CameraPermission
          onRequestPermission={requestCameraPermission}
          isRequesting={isRequestingPermission}
          error={permissionError}
          onRetry={handleRetryPermission}
        />
      ) : (
        <div className="flex flex-col items-center gap-6 py-4">
          <QrScanner onScan={handleQRScan} isProcessing={isProcessingQR} />
        </div>
      )}

      {/* Reservation Modal */}
      <ReservationModal
        reservation={reservation}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onConfirmCheckIn={handleConfirmCheckIn}
        isConfirming={isConfirming}
      />
    </div>
  )
}
