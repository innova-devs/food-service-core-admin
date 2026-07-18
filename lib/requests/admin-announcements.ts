import { api } from "@/lib/api"
import type { Announcement } from "@/components/super-admin/announcement-types"

export const ADMIN_ANNOUNCEMENTS_PATH = "/admin/announcements"

export interface BusinessAnnouncement extends Announcement {
  isRead: boolean
  readAt: string | null
}

export interface BusinessAnnouncementsListResponse {
  items: BusinessAnnouncement[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function fetchBusinessAnnouncements(params: {
  page?: number
  pageSize?: number
} = {}): Promise<BusinessAnnouncementsListResponse> {
  const { data } = await api.get<BusinessAnnouncementsListResponse>(
    ADMIN_ANNOUNCEMENTS_PATH,
    {
      params: {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 50,
      },
    },
  )
  return {
    items: Array.isArray(data.items) ? data.items : [],
    total: Number(data.total) || 0,
    page: Number(data.page) || 1,
    pageSize: Number(data.pageSize) || 50,
    totalPages: Number(data.totalPages) || 0,
  }
}

export async function fetchBusinessUnreadCount(): Promise<number> {
  const { data } = await api.get<{ count: number }>(
    `${ADMIN_ANNOUNCEMENTS_PATH}/unread-count`,
  )
  return Number(data.count) || 0
}

export async function markBusinessAnnouncementRead(
  id: string,
): Promise<void> {
  await api.post(`${ADMIN_ANNOUNCEMENTS_PATH}/${encodeURIComponent(id)}/read`)
}
