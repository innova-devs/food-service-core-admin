"use client"

import { useCallback, useEffect, useState } from "react"
import { Upload, X, ImageIcon } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])
const MAX_BYTES = 5 * 1024 * 1024

export type ImageUploaderValue = {
  /** URL pública existente o object URL local de preview. */
  previewUrl: string | null
  /** Archivo pendiente de subir; null si no hay cambio de archivo. */
  file: File | null
  /** true si el usuario eliminó la imagen (hay que llamar DELETE). */
  removed: boolean
}

interface ImageUploaderProps {
  id: string
  label: string
  value: ImageUploaderValue
  onChange: (value: ImageUploaderValue) => void
  disabled?: boolean
  className?: string
  error?: string
  /** Compat: el padre puede bloquear el submit ante error local de archivo. */
  onBlockingValidationChange?: (hasBlockingError: boolean) => void
}

export function emptyImageUploaderValue(
  existingUrl: string | null = null,
): ImageUploaderValue {
  return {
    previewUrl: existingUrl,
    file: null,
    removed: false,
  }
}

export function ImageUploader({
  id,
  label,
  value,
  onChange,
  disabled = false,
  className,
  error,
  onBlockingValidationChange,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (value.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(value.previewUrl)
      }
    }
  }, [value.previewUrl])

  useEffect(() => {
    onBlockingValidationChange?.(Boolean(localError))
  }, [localError, onBlockingValidationChange])

  const applyFile = useCallback(
    (file: File) => {
      if (!ACCEPTED_TYPES.has(file.type)) {
        setLocalError("Solo se permiten JPEG, PNG o WebP")
        return
      }
      if (file.size > MAX_BYTES) {
        setLocalError("La imagen supera el tamaño máximo de 5 MB")
        return
      }
      setLocalError(null)
      if (value.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(value.previewUrl)
      }
      onChange({
        previewUrl: URL.createObjectURL(file),
        file,
        removed: false,
      })
    },
    [onChange, value.previewUrl],
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!disabled) setIsDragging(true)
    },
    [disabled],
  )

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      if (disabled) return
      const file = e.dataTransfer.files?.[0]
      if (file) applyFile(file)
    },
    [disabled, applyFile],
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) applyFile(file)
      e.target.value = ""
    },
    [applyFile],
  )

  const handleRemove = useCallback(() => {
    if (value.previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(value.previewUrl)
    }
    setLocalError(null)
    onChange({ previewUrl: null, file: null, removed: true })
  }, [onChange, value.previewUrl])

  const displayError = error || localError

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={id}>{label}</Label>

      {value.previewUrl ? (
        <div className="relative w-full max-w-xs">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
            <Image
              src={value.previewUrl}
              alt="Vista previa del producto"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -right-2 -top-2 size-7"
            onClick={handleRemove}
            disabled={disabled}
          >
            <X className="size-4" />
            <span className="sr-only">Eliminar imagen</span>
          </Button>
        </div>
      ) : (
        <label
          htmlFor={id}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
            disabled && "cursor-not-allowed opacity-50",
            displayError && "border-destructive",
          )}
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            {isDragging ? (
              <Upload className="size-6 text-primary" />
            ) : (
              <ImageIcon className="size-6 text-muted-foreground" />
            )}
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">
              {isDragging ? "Suelta la imagen aquí" : "Arrastra una imagen aquí"}
            </p>
            <p className="text-xs text-muted-foreground">
              JPEG, PNG o WebP · máx. 5 MB
            </p>
          </div>
          <input
            id={id}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={disabled}
            className="sr-only"
          />
        </label>
      )}
      {displayError && (
        <p className="text-sm text-destructive" role="alert">
          {displayError}
        </p>
      )}
    </div>
  )
}
