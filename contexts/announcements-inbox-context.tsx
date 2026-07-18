"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { isAxiosError } from "axios"
import {
  fetchBusinessAnnouncements,
  markBusinessAnnouncementRead,
  type BusinessAnnouncement,
} from "@/lib/requests/admin-announcements"
import { getUserRoleFromCookie } from "@/lib/auth"

type AnnouncementsInboxContextValue = {
  announcements: BusinessAnnouncement[]
  unreadCount: number
  isLoading: boolean
  open: boolean
  openInbox: (opts?: { unreadOnly?: boolean }) => void
  closeInbox: () => void
  markCurrentAsRead: () => Promise<void>
  queue: BusinessAnnouncement[]
  currentIndex: number
  current: BusinessAnnouncement | null
  goNext: () => void
  goPrev: () => void
  refresh: () => Promise<void>
}

const AnnouncementsInboxContext =
  createContext<AnnouncementsInboxContextValue | null>(null)

export function useAnnouncementsInbox() {
  const ctx = useContext(AnnouncementsInboxContext)
  if (!ctx) {
    throw new Error(
      "useAnnouncementsInbox debe usarse dentro de AnnouncementsInboxProvider",
    )
  }
  return ctx
}

/** Versión segura para Header (puede no estar montado en super-admin). */
export function useAnnouncementsInboxOptional() {
  return useContext(AnnouncementsInboxContext)
}

export function AnnouncementsInboxProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [announcements, setAnnouncements] = useState<BusinessAnnouncement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [queue, setQueue] = useState<BusinessAnnouncement[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [autoOpened, setAutoOpened] = useState(false)

  const refresh = useCallback(async () => {
    const role = getUserRoleFromCookie()
    if (role === "SUPER_ADMIN" || role === "UNKNOWN") {
      setAnnouncements([])
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    try {
      const { items } = await fetchBusinessAnnouncements({ pageSize: 50 })
      setAnnouncements(items)
    } catch (e) {
      // Silencioso: el inbox no debe romper el panel si falla
      if (isAxiosError(e) && e.response?.status === 401) {
        setAnnouncements([])
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const unreadCount = useMemo(
    () => announcements.filter((a) => !a.isRead).length,
    [announcements],
  )

  // Auto-abrir si hay no leídos al cargar
  useEffect(() => {
    if (autoOpened || isLoading) return
    const unread = announcements.filter((a) => !a.isRead)
    if (unread.length === 0) return
    setQueue(unread)
    setCurrentIndex(0)
    setOpen(true)
    setAutoOpened(true)
  }, [announcements, isLoading, autoOpened])

  const openInbox = useCallback(
    (opts?: { unreadOnly?: boolean }) => {
      const unreadOnly = opts?.unreadOnly ?? unreadCount > 0
      const nextQueue = unreadOnly
        ? announcements.filter((a) => !a.isRead)
        : announcements
      if (nextQueue.length === 0) {
        // Si no hay no leídos, mostrar todos los vigentes
        const all = announcements
        if (all.length === 0) return
        setQueue(all)
      } else {
        setQueue(nextQueue)
      }
      setCurrentIndex(0)
      setOpen(true)
    },
    [announcements, unreadCount],
  )

  const closeInbox = useCallback(() => {
    setOpen(false)
  }, [])

  const current = queue[currentIndex] ?? null

  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, Math.max(0, queue.length - 1)))
  }, [queue.length])

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1))
  }, [])

  const markCurrentAsRead = useCallback(async () => {
    const item = queue[currentIndex]
    if (!item || item.isRead) {
      // Avanzar o cerrar
      if (currentIndex < queue.length - 1) {
        setCurrentIndex((i) => i + 1)
      } else {
        setOpen(false)
      }
      return
    }

    try {
      await markBusinessAnnouncementRead(item.id)
    } catch {
      // Igual actualizamos UI localmente si el backend ya lo tenía leído
    }

    setAnnouncements((prev) =>
      prev.map((a) =>
        a.id === item.id
          ? { ...a, isRead: true, readAt: new Date().toISOString() }
          : a,
      ),
    )

    // Quitar de la cola de no leídos y avanzar
    const nextQueue = queue.filter((a) => a.id !== item.id)
    if (nextQueue.length === 0) {
      setQueue([])
      setOpen(false)
      return
    }
    setQueue(nextQueue)
    setCurrentIndex((i) => Math.min(i, nextQueue.length - 1))
  }, [queue, currentIndex])

  const value = useMemo<AnnouncementsInboxContextValue>(
    () => ({
      announcements,
      unreadCount,
      isLoading,
      open,
      openInbox,
      closeInbox,
      markCurrentAsRead,
      queue,
      currentIndex,
      current,
      goNext,
      goPrev,
      refresh,
    }),
    [
      announcements,
      unreadCount,
      isLoading,
      open,
      openInbox,
      closeInbox,
      markCurrentAsRead,
      queue,
      currentIndex,
      current,
      goNext,
      goPrev,
      refresh,
    ],
  )

  return (
    <AnnouncementsInboxContext.Provider value={value}>
      {children}
    </AnnouncementsInboxContext.Provider>
  )
}
