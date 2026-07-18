"use client"

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AnnouncementRow } from "./announcement-row"
import type { Announcement } from "./announcement-types"

interface AnnouncementsTableProps {
  announcements: Announcement[]
  onEdit: (announcement: Announcement) => void
  onDelete: (announcement: Announcement) => void
  onManageMedia: (announcement: Announcement) => void
}

export function AnnouncementsTable({
  announcements,
  onEdit,
  onDelete,
  onManageMedia,
}: AnnouncementsTableProps) {
  if (announcements.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        No hay anuncios para mostrar
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Título</TableHead>
          <TableHead>Dirigido a</TableHead>
          <TableHead>Publicación</TableHead>
          <TableHead>Expiración</TableHead>
          <TableHead>Adjunto</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="w-12">
            <span className="sr-only">Acciones</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {announcements.map((announcement) => (
          <AnnouncementRow
            key={announcement.id}
            announcement={announcement}
            onEdit={() => onEdit(announcement)}
            onDelete={() => onDelete(announcement)}
            onManageMedia={() => onManageMedia(announcement)}
          />
        ))}
      </TableBody>
    </Table>
  )
}
