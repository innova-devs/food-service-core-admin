"use client"

import { CameraIcon, AlertCircleIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface CameraPermissionProps {
  onRequestPermission: () => void
  isRequesting?: boolean
  error?: string | null
  onRetry?: () => void
}

export function CameraPermission({
  onRequestPermission,
  isRequesting = false,
  error = null,
  onRetry,
}: CameraPermissionProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            {error ? (
              <AlertCircleIcon className="h-8 w-8 text-destructive" />
            ) : (
              <CameraIcon className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <CardTitle className="text-xl">
            {error ? "Acceso a camara denegado" : "Habilitar acceso a camara"}
          </CardTitle>
          <CardDescription>
            {error
              ? "No se pudo acceder a la camara. Por favor, habilita el permiso en la configuracion de tu navegador e intenta nuevamente."
              : "Se necesita acceso a la camara para escanear los codigos QR de las reservas."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {error ? (
            <>
              <div className="rounded-lg bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
              {onRetry && (
                <Button onClick={onRetry} className="w-full">
                  Reintentar
                </Button>
              )}
            </>
          ) : (
            <Button
              onClick={onRequestPermission}
              disabled={isRequesting}
              className="w-full"
            >
              {isRequesting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Solicitando permiso...
                </>
              ) : (
                <>
                  <CameraIcon className="h-4 w-4" />
                  Permitir camara
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
