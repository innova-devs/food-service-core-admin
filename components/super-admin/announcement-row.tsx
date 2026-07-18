"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import { MoreHorizontal, Pencil, Trash2, ImageIcon } from "lucide-react"
import { TableCell, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AnnouncementStatusBadge } from "./announcement-status-badge"
import { getAnnouncementStatus, ROLE_LABELS } from "./announcement-types"
import type { Announcement } from "./announcement-types"

interface AnnouncementRowProps {
  announcement: Announcement
  onEdit: (announcement: Announcement) => void
  onDelete: (announcement: Announcement) => void
  onManageMedia: (announcement: Announcement) => void
}

export function AnnouncementRow({
  announcement,
  onEdit,
  onDelete,
  onManageMedia,
}: AnnouncementRowProps) {
  const status = getAnnouncementStatus(announcement)

  return (
    <TableRow>
      {/* Título */}
      <TableCell className="max-w-[220px]">
        <span className="block truncate font-medium">{announcement.title}</span>
      </TableCell>

      {/* Roles destino */}
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {announcement.targetRoles.map((role) => (
            <Badge key={role} variant="outline" className="text-xs">
              {ROLE_LABELS[role]}
            </Badge>
          ))}
        </div>
      </TableCell>

      {/* Publicación */}
      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
        {format(new Date(announcement.publishedAt), "dd/MM/yyyy HH:mm", { locale: es })}
      </TableCell>

      {/* Expiración */}
      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
        {announcement.expiresAt
          ? format(new Date(announcement.expiresAt), "dd/MM/yyyy HH:mm", { locale: es })
          : <span className="text-xs italic">Sin expiración</span>}
      </TableCell>

      {/* Media */}
      <TableCell>
        {announcement.media ? (
          <ImageIcon className="size-4 text-muted-foreground" />
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>

      {/* Estado */}
      <TableCell>
        <AnnouncementStatusBadge status={status} />
      </TableCell>

      {/* Acciones */}
      <TableCell className="w-12">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Acciones</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(announcement)}>
              <Pencil className="mr-2 size-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onManageMedia(announcement)}>
              <ImageIcon className="mr-2 size-4" />
              Adjunto
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(announcement)}
            >
              <Trash2 className="mr-2 size-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}
