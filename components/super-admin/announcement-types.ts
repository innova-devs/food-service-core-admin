export type AnnouncementTargetRole = "OWNER" | "ADMIN" | "STAFF" | "DELIVERY"

export const ANNOUNCEMENT_TARGET_ROLES: AnnouncementTargetRole[] = [
  "OWNER",
  "ADMIN",
  "STAFF",
  "DELIVERY",
]

export const ROLE_LABELS: Record<AnnouncementTargetRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  STAFF: "Staff",
  DELIVERY: "Delivery",
}

export type AnnouncementMediaType = "image" | "gif" | "video"

export interface AnnouncementMedia {
  key: string | null
  url: string
  type: AnnouncementMediaType | null
  mime: string | null
}

export interface Announcement {
  id: string
  title: string
  bodyHtml: string
  targetRoles: AnnouncementTargetRole[]
  media: AnnouncementMedia | null
  publishedAt: string
  expiresAt: string | null
  isActive: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface AnnouncementsListResponse {
  items: Announcement[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type AnnouncementStatus = "active" | "scheduled" | "expired" | "inactive"

export function getAnnouncementStatus(announcement: Announcement): AnnouncementStatus {
  if (!announcement.isActive) return "inactive"
  const now = new Date()
  const published = new Date(announcement.publishedAt)
  if (published > now) return "scheduled"
  if (announcement.expiresAt && new Date(announcement.expiresAt) <= now) return "expired"
  return "active"
}
