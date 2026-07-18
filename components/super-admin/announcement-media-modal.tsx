"use client"

import { useRef, useState } from "react"
import { Loader2, Trash2, Upload, FileImage, FileVideo } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Announcement } from "./announcement-types"

interface AnnouncementMediaModalProps {
  announcement: Announcement | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpload: (file: File) => Promise<void>
  onRemove: () => Promise<void>
  isUploading: boolean
  isRemoving: boolean
}

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
const MAX_IMAGE_MB = 10
const MAX_VIDEO_MB = 50

export function AnnouncementMediaModal({
  announcement,
  open,
  onOpenChange,
  onUpload,
  onRemove,
  isUploading,
  isRemoving,
}: AnnouncementMediaModalProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  if (!announcement) return null

  const media = announcement.media

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLocalError(null)

    const isVideo = file.type.startsWith("video/")
    const maxBytes = isVideo ? MAX_VIDEO_MB * 1024 * 1024 : MAX_IMAGE_MB * 1024 * 1024
    if (file.size > maxBytes) {
      setLocalError(
        `El archivo supera el tamaño máximo (${isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB} MB).`,
      )
      return
    }
    await onUpload(file)
    // Reset el input para permitir re-seleccionar el mismo archivo
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjunto del anuncio</DialogTitle>
          <DialogDescription>
            Podés subir una imagen (JPEG, PNG, WebP, GIF) hasta {MAX_IMAGE_MB} MB o un video
            (MP4, WebM) hasta {MAX_VIDEO_MB} MB. Solo se permite un adjunto por anuncio.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Preview del adjunto actual */}
          {media ? (
            <div className="flex flex-col gap-2 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  {media.type === "video" ? (
                    <FileVideo className="size-4 text-muted-foreground" />
                  ) : (
                    <FileImage className="size-4 text-muted-foreground" />
                  )}
                  <span className="truncate max-w-[200px]">{media.key?.split("/").pop()}</span>
                  <Badge variant="outline" className="text-xs">{media.type}</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-destructive hover:text-destructive"
                  disabled={isRemoving || isUploading}
                  onClick={() => void onRemove()}
                >
                  {isRemoving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                  <span className="sr-only">Quitar adjunto</span>
                </Button>
              </div>

              {media.type !== "video" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={media.url}
                  alt="Vista previa del adjunto"
                  className="max-h-48 w-full rounded object-contain"
                />
              )}
              {media.type === "video" && (
                <video
                  src={media.url}
                  controls
                  className="max-h-48 w-full rounded"
                />
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-6 text-center text-muted-foreground">
              <FileImage className="size-8" />
              <p className="text-sm">Sin adjunto</p>
            </div>
          )}

          {localError && (
            <p className="text-xs text-destructive">{localError}</p>
          )}

          {/* Input de archivo */}
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUploading || isRemoving}
          >
            Cerrar
          </Button>
          <Button
            disabled={isUploading || isRemoving}
            onClick={() => inputRef.current?.click()}
          >
            {isUploading ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Upload className="mr-2 size-4" />
            )}
            {media ? "Reemplazar" : "Subir adjunto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
