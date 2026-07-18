import { api } from "@/lib/api"
import type {
  Announcement,
  AnnouncementsListResponse,
  AnnouncementTargetRole,
} from "@/components/super-admin/announcement-types"

export const SUPER_ADMIN_ANNOUNCEMENTS_PATH = "/super-admin/announcements"

// ---------------------------------------------------------------------------
// Params / Response
// ---------------------------------------------------------------------------

export interface FetchAnnouncementsParams {
  page?: number
  pageSize?: number
  active?: boolean
}

export interface CreateAnnouncementPayload {
  title: string
  bodyHtml: string
  targetRoles: AnnouncementTargetRole[]
  publishedAt: string // ISO
  expiresAt?: string | null
}

export interface UpdateAnnouncementPayload {
  title?: string
  bodyHtml?: string
  targetRoles?: AnnouncementTargetRole[]
  publishedAt?: string
  expiresAt?: string | null
  isActive?: boolean
}

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

export async function fetchSuperAdminAnnouncements(
  params: FetchAnnouncementsParams = {},
): Promise<AnnouncementsListResponse> {
  const { data } = await api.get<AnnouncementsListResponse>(
    SUPER_ADMIN_ANNOUNCEMENTS_PATH,
    {
      params: {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 10,
        ...(params.active !== undefined ? { active: params.active } : {}),
      },
    },
  )
  return data
}

export async function fetchSuperAdminAnnouncementById(id: string): Promise<Announcement> {
  const { data } = await api.get<Announcement>(
    `${SUPER_ADMIN_ANNOUNCEMENTS_PATH}/${encodeURIComponent(id)}`,
  )
  return data
}

export async function createSuperAdminAnnouncement(
  payload: CreateAnnouncementPayload,
): Promise<Announcement> {
  const { data } = await api.post<Announcement>(SUPER_ADMIN_ANNOUNCEMENTS_PATH, payload)
  return data
}

export async function updateSuperAdminAnnouncement(
  id: string,
  payload: UpdateAnnouncementPayload,
): Promise<Announcement> {
  const { data } = await api.patch<Announcement>(
    `${SUPER_ADMIN_ANNOUNCEMENTS_PATH}/${encodeURIComponent(id)}`,
    payload,
  )
  return data
}

export async function deleteSuperAdminAnnouncement(id: string): Promise<void> {
  await api.delete(`${SUPER_ADMIN_ANNOUNCEMENTS_PATH}/${encodeURIComponent(id)}`)
}

export async function uploadAnnouncementMedia(
  id: string,
  file: File,
): Promise<Announcement> {
  const formData = new FormData()
  formData.append("media", file)
  const { data } = await api.post<Announcement>(
    `${SUPER_ADMIN_ANNOUNCEMENTS_PATH}/${encodeURIComponent(id)}/media`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  )
  return data
}

export async function deleteAnnouncementMedia(id: string): Promise<void> {
  await api.delete(
    `${SUPER_ADMIN_ANNOUNCEMENTS_PATH}/${encodeURIComponent(id)}/media`,
  )
}
