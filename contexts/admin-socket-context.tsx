"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { usePathname } from "next/navigation"
import { io, type Socket } from "socket.io-client"

import { getAuthCookie } from "@/lib/auth"
import { getSocketBaseUrl } from "@/lib/socket-base-url"

export type AdminNotificationKind = "order" | "reservation"

export interface AdminNotification {
  id: string
  kind: AdminNotificationKind
  resourceId: string
  at: string
  title: string
  subtitle?: string
  read: boolean
}

export type AdminOrderSocketPayload = {
  type: string
  businessId: string
  orderId: string
  total?: string
  currency?: string
  at: string
}

export type AdminReservationSocketPayload = {
  type: string
  businessId: string
  reservationId: string
  at: string
}

type AdminSocketContextValue = {
  isConnected: boolean
  notifications: AdminNotification[]
  badgeCount: number
  removeNotification: (id: string) => void
  subscribeToNewOrders: (cb: (orderId: string) => void) => () => void
  subscribeToNewReservations: (cb: (reservationId: string) => void) => () => void
}

const AdminSocketContext = createContext<AdminSocketContextValue | null>(null)

export function AdminSocketProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const pathnameRef = useRef(pathname)
  pathnameRef.current = pathname

  const [isConnected, setIsConnected] = useState(false)
  const [notifications, setNotifications] = useState<AdminNotification[]>([])

  const orderListenersRef = useRef(new Set<(id: string) => void>())
  const reservationListenersRef = useRef(new Set<(id: string) => void>())
  const socketRef = useRef<Socket | null>(null)

  const subscribeToNewOrders = useCallback((cb: (orderId: string) => void) => {
    orderListenersRef.current.add(cb)
    return () => {
      orderListenersRef.current.delete(cb)
    }
  }, [])

  const subscribeToNewReservations = useCallback(
    (cb: (reservationId: string) => void) => {
      reservationListenersRef.current.add(cb)
      return () => {
        reservationListenersRef.current.delete(cb)
      }
    },
    [],
  )

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  useEffect(() => {
    if (pathname === "/orders") {
      setNotifications((prev) =>
        prev.map((n) => (n.kind === "order" ? { ...n, read: true } : n)),
      )
    }
  }, [pathname])

  useEffect(() => {
    if (pathname === "/reservations") {
      setNotifications((prev) =>
        prev.map((n) =>
          n.kind === "reservation" ? { ...n, read: true } : n,
        ),
      )
    }
  }, [pathname])

  const badgeCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  )

  useEffect(() => {
    const token = getAuthCookie()
    const base = getSocketBaseUrl()
    if (!token || !base) {
      return
    }

    const socket = io(base, {
      path: "/socket.io",
      auth: { token },
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 8000,
    })

    socketRef.current = socket

    socket.on("connect", () => setIsConnected(true))
    socket.on("disconnect", () => setIsConnected(false))
    socket.on("connect_error", () => setIsConnected(false))

    socket.on("admin:order", (p: AdminOrderSocketPayload) => {
      const orderId = p.orderId
      orderListenersRef.current.forEach((fn) => {
        try {
          fn(orderId)
        } catch {
          /* noop */
        }
      })

      const path = pathnameRef.current
      const read = path === "/orders"
      const subtitle =
        p.total != null && p.currency
          ? `${p.total} ${p.currency}`
          : p.total != null
            ? String(p.total)
            : undefined

      setNotifications((prev) => {
        const next: AdminNotification = {
          id: `order-${orderId}-${Date.now()}`,
          kind: "order",
          resourceId: orderId,
          at: p.at,
          title: "Nuevo pedido",
          subtitle,
          read,
        }
        return [next, ...prev].slice(0, 40)
      })
    })

    socket.on("admin:reservation", (p: AdminReservationSocketPayload) => {
      const reservationId = p.reservationId
      reservationListenersRef.current.forEach((fn) => {
        try {
          fn(reservationId)
        } catch {
          /* noop */
        }
      })

      const path = pathnameRef.current
      const read = path === "/reservations"

      setNotifications((prev) => {
        const next: AdminNotification = {
          id: `reservation-${reservationId}-${Date.now()}`,
          kind: "reservation",
          resourceId: reservationId,
          at: p.at,
          title: "Nueva reserva",
          read,
        }
        return [next, ...prev].slice(0, 40)
      })
    })

    return () => {
      socket.removeAllListeners()
      socket.close()
      socketRef.current = null
      setIsConnected(false)
    }
  }, [])

  const value = useMemo<AdminSocketContextValue>(
    () => ({
      isConnected,
      notifications,
      badgeCount,
      removeNotification,
      subscribeToNewOrders,
      subscribeToNewReservations,
    }),
    [
      isConnected,
      notifications,
      badgeCount,
      removeNotification,
      subscribeToNewOrders,
      subscribeToNewReservations,
    ],
  )

  return (
    <AdminSocketContext.Provider value={value}>
      {children}
    </AdminSocketContext.Provider>
  )
}

export function useAdminSocket() {
  const ctx = useContext(AdminSocketContext)
  if (!ctx) {
    throw new Error("useAdminSocket debe usarse dentro de AdminSocketProvider")
  }
  return ctx
}
