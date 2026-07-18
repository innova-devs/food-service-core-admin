"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Megaphone } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAnnouncementsInbox } from "@/contexts/announcements-inbox-context"

export function AnnouncementsInboxModal() {
  const {
    open,
    closeInbox,
    current,
    queue,
    currentIndex,
    markCurrentAsRead,
    goNext,
    goPrev,
  } = useAnnouncementsInbox()

  const total = queue.length
  const hasMultiple = total > 1
  const isLast = currentIndex >= total - 1

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) closeInbox()
      }}
    >
      <DialogContent className="flex max-h-[min(90vh,720px)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="space-y-3 border-b px-6 py-5 text-left">
          <div className="flex items-center justify-between gap-3 pr-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Megaphone className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wide">
                Anuncio
              </span>
            </div>
            {hasMultiple ? (
              <Badge variant="secondary" className="tabular-nums">
                {currentIndex + 1} de {total}
              </Badge>
            ) : null}
          </div>
          <DialogTitle className="text-xl leading-snug">
            {current?.title ?? "Anuncios"}
          </DialogTitle>
          {current ? (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>
                Publicado{" "}
                {format(new Date(current.publishedAt), "dd/MM/yyyy HH:mm", {
                  locale: es,
                })}
              </span>
              {!current.isRead ? (
                <Badge className="border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                  Nuevo
                </Badge>
              ) : null}
            </div>
          ) : (
            <DialogDescription>No hay anuncios para mostrar.</DialogDescription>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {current?.media ? (
            <div className="mb-4 overflow-hidden rounded-lg border">
              {current.media.type === "video" ? (
                <video
                  src={current.media.url}
                  controls
                  className="max-h-56 w-full bg-black object-contain"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={current.media.url}
                  alt=""
                  className="max-h-56 w-full object-contain"
                />
              )}
            </div>
          ) : null}

          {current ? (
            <div
              className="tiptap-content"
              dangerouslySetInnerHTML={{ __html: current.bodyHtml }}
            />
          ) : null}
        </div>

        <DialogFooter className="flex-row items-center justify-between gap-2 border-t px-6 py-4 sm:justify-between">
          <div className="flex items-center gap-1">
            {hasMultiple ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={currentIndex === 0}
                  onClick={goPrev}
                  aria-label="Anuncio anterior"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={isLast}
                  onClick={goNext}
                  aria-label="Anuncio siguiente"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </>
            ) : (
              <span />
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" onClick={closeInbox}>
              Cerrar
            </Button>
            {current ? (
              <Button type="button" onClick={() => void markCurrentAsRead()}>
                {current.isRead
                  ? isLast
                    ? "Listo"
                    : "Siguiente"
                  : hasMultiple && !isLast
                    ? "Entendido y siguiente"
                    : "Entendido"}
              </Button>
            ) : null}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
