"use client"

import { useState, useEffect, useCallback } from "react"
import { isAxiosError } from "axios"
import { toast } from "sonner"
import { Plus, Filter } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { AnnouncementsTable } from "@/components/super-admin/announcements-table"
import { AnnouncementFormSheet } from "@/components/super-admin/announcement-form-sheet"
import { AnnouncementDeleteModal } from "@/components/super-admin/announcement-delete-modal"
import { AnnouncementMediaModal } from "@/components/super-admin/announcement-media-modal"
import type { AnnouncementFormValues } from "@/components/super-admin/announcement-form-sheet"
import type { Announcement } from "@/components/super-admin/announcement-types"
import {
  fetchSuperAdminAnnouncements,
  createSuperAdminAnnouncement,
  updateSuperAdminAnnouncement,
  deleteSuperAdminAnnouncement,
  uploadAnnouncementMedia,
  deleteAnnouncementMedia,
} from "@/lib/requests/super-admin-announcements"

const ITEMS_PER_PAGE = 10

type ActiveFilter = "all" | "active" | "inactive"

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Form sheet
  const [formOpen, setFormOpen] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Delete modal
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<Announcement | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Media modal
  const [mediaOpen, setMediaOpen] = useState(false)
  const [mediaAnnouncement, setMediaAnnouncement] = useState<Announcement | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isRemovingMedia, setIsRemovingMedia] = useState(false)

  const loadList = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const result = await fetchSuperAdminAnnouncements({
        page: currentPage,
        pageSize: ITEMS_PER_PAGE,
        ...(activeFilter !== "all" ? { active: activeFilter === "active" } : {}),
      })
      setAnnouncements(result.items)
      setTotal(result.total)
    } catch (e) {
      const msg = isAxiosError(e)
        ? (e.response?.data as { message?: string; error?: string })?.message ??
          (e.response?.data as { message?: string; error?: string })?.error ??
          e.message
        : "No se pudieron cargar los anuncios."
      setLoadError(typeof msg === "string" && msg ? msg : "No se pudieron cargar los anuncios.")
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, activeFilter])

  useEffect(() => {
    void loadList()
  }, [loadList])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeFilter])

  // ---------------------------------------------------------------------------
  // Create / Edit
  // ---------------------------------------------------------------------------

  const handleCreate = () => {
    setEditingAnnouncement(null)
    setFormOpen(true)
  }

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement)
    setFormOpen(true)
  }

  const handleFormSubmit = async (values: AnnouncementFormValues) => {
    setIsSaving(true)
    try {
      const payload = {
        title: values.title,
        bodyHtml: values.bodyHtml,
        targetRoles: values.targetRoles,
        publishedAt: values.publishedAt.toISOString(),
        expiresAt: values.expiresAt ? values.expiresAt.toISOString() : null,
        ...(editingAnnouncement ? { isActive: values.isActive } : {}),
      }

      if (editingAnnouncement) {
        const updated = await updateSuperAdminAnnouncement(editingAnnouncement.id, payload)
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === updated.id ? updated : a)),
        )
        toast.success("Anuncio actualizado correctamente")
      } else {
        await createSuperAdminAnnouncement({
          title: payload.title,
          bodyHtml: payload.bodyHtml,
          targetRoles: payload.targetRoles,
          publishedAt: payload.publishedAt,
          expiresAt: payload.expiresAt,
        })
        toast.success("Anuncio creado correctamente")
        void loadList()
      }
      setFormOpen(false)
    } catch (e) {
      const msg = isAxiosError(e)
        ? (e.response?.data as { message?: string; error?: string })?.error ??
          (e.response?.data as { message?: string; error?: string })?.message ??
          e.message
        : "Ocurrió un error al guardar."
      toast.error(typeof msg === "string" && msg ? msg : "Ocurrió un error al guardar.")
    } finally {
      setIsSaving(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------

  const handleDelete = (announcement: Announcement) => {
    setDeletingAnnouncement(announcement)
    setDeleteOpen(true)
  }

  const confirmDelete = async () => {
    if (!deletingAnnouncement) return
    setIsDeleting(true)
    try {
      await deleteSuperAdminAnnouncement(deletingAnnouncement.id)
      setAnnouncements((prev) => prev.filter((a) => a.id !== deletingAnnouncement.id))
      setTotal((t) => Math.max(0, t - 1))
      toast.success(`Anuncio "${deletingAnnouncement.title}" eliminado`)
      setDeleteOpen(false)
    } catch (e) {
      const msg = isAxiosError(e)
        ? (e.response?.data as { error?: string })?.error ?? e.message
        : "No se pudo eliminar el anuncio."
      toast.error(typeof msg === "string" && msg ? msg : "No se pudo eliminar el anuncio.")
    } finally {
      setIsDeleting(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Media
  // ---------------------------------------------------------------------------

  const handleManageMedia = (announcement: Announcement) => {
    setMediaAnnouncement(announcement)
    setMediaOpen(true)
  }

  const handleUploadMedia = async (file: File) => {
    if (!mediaAnnouncement) return
    setIsUploading(true)
    try {
      await uploadAnnouncementMedia(mediaAnnouncement.id, file)
      toast.success("Adjunto subido correctamente")
      // Reload para reflejar la nueva media URL
      const result = await fetchSuperAdminAnnouncements({
        page: currentPage,
        pageSize: ITEMS_PER_PAGE,
        ...(activeFilter !== "all" ? { active: activeFilter === "active" } : {}),
      })
      setAnnouncements(result.items)
      // Actualizar también el announcement en el modal
      const updated = result.items.find((a) => a.id === mediaAnnouncement.id)
      if (updated) setMediaAnnouncement(updated)
    } catch (e) {
      const msg = isAxiosError(e)
        ? (e.response?.data as { error?: string })?.error ?? e.message
        : "Error al subir el adjunto."
      toast.error(typeof msg === "string" && msg ? msg : "Error al subir el adjunto.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveMedia = async () => {
    if (!mediaAnnouncement) return
    setIsRemovingMedia(true)
    try {
      await deleteAnnouncementMedia(mediaAnnouncement.id)
      toast.success("Adjunto eliminado")
      setAnnouncements((prev) =>
        prev.map((a) =>
          a.id === mediaAnnouncement.id ? { ...a, media: null } : a,
        ),
      )
      setMediaAnnouncement((prev) => (prev ? { ...prev, media: null } : null))
    } catch (e) {
      const msg = isAxiosError(e)
        ? (e.response?.data as { error?: string })?.error ?? e.message
        : "Error al eliminar el adjunto."
      toast.error(typeof msg === "string" && msg ? msg : "Error al eliminar el adjunto.")
    } finally {
      setIsRemovingMedia(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Pagination
  // ---------------------------------------------------------------------------

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE))

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Anuncios</h1>
          <p className="text-muted-foreground">
            Comunicados de plataforma para los administradores de los negocios
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 size-4" />
          Nuevo anuncio
        </Button>
      </div>

      {loadError && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <CardTitle className="text-base font-medium">Todos los anuncios</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 size-4" />
                {activeFilter === "all" && "Todos"}
                {activeFilter === "active" && "Activos"}
                {activeFilter === "inactive" && "Inactivos"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                checked={activeFilter === "all"}
                onCheckedChange={() => setActiveFilter("all")}
              >
                Todos
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={activeFilter === "active"}
                onCheckedChange={() => setActiveFilter("active")}
              >
                Activos
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={activeFilter === "inactive"}
                onCheckedChange={() => setActiveFilter("inactive")}
              >
                Inactivos
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <AnnouncementsTable
              announcements={announcements}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onManageMedia={handleManageMedia}
            />
          )}
        </CardContent>
      </Card>

      {!isLoading && totalPages > 1 && (
        <Pagination aria-label="Paginación de anuncios">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                label="Anterior"
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setCurrentPage((p) => Math.max(1, p - 1))
                }}
                aria-disabled={currentPage === 1}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        setCurrentPage(page)
                      }}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              }
              if (page === currentPage - 2 || page === currentPage + 2) {
                return (
                  <PaginationItem key={page}>
                    <PaginationEllipsis srOnlyLabel="Más páginas" />
                  </PaginationItem>
                )
              }
              return null
            })}
            <PaginationItem>
              <PaginationNext
                label="Siguiente"
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }}
                aria-disabled={currentPage === totalPages}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {!isLoading && (
        <p className="text-center text-sm text-muted-foreground">
          {total === 0
            ? "Sin anuncios"
            : `Mostrando ${(currentPage - 1) * ITEMS_PER_PAGE + 1}–${Math.min(currentPage * ITEMS_PER_PAGE, total)} de ${total}`}
        </p>
      )}

      {/* Modales */}
      <AnnouncementFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        announcement={editingAnnouncement}
        onSubmit={handleFormSubmit}
        isSaving={isSaving}
      />

      <AnnouncementDeleteModal
        announcement={deletingAnnouncement}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />

      <AnnouncementMediaModal
        announcement={mediaAnnouncement}
        open={mediaOpen}
        onOpenChange={setMediaOpen}
        onUpload={handleUploadMedia}
        onRemove={handleRemoveMedia}
        isUploading={isUploading}
        isRemoving={isRemovingMedia}
      />
    </div>
  )
}
