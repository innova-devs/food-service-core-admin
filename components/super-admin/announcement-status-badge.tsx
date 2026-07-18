"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { AnnouncementStatus } from "./announcement-types"

const STATUS_CONFIG: Record<
  AnnouncementStatus,
  { label: string; className: string }
> = {
  active: {
    label: "Vigente",
    className: "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  scheduled: {
    label: "Programado",
    className: "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  },
  expired: {
    label: "Expirado",
    className: "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  },
  inactive: {
    label: "Inactivo",
    className: "border-transparent bg-secondary text-secondary-foreground",
  },
}

export function AnnouncementStatusBadge({ status }: { status: AnnouncementStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <Badge className={cn(config.className)}>
      {config.label}
    </Badge>
  )
}
