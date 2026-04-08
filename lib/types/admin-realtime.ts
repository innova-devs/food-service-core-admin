/**
 * Alineado con el backend (`AdminOrderRealtimePayload`).
 * Evento: `admin:order` con discriminador `type`.
 */
export type AdminOrderRealtimePayload =
  | {
      type: "order.created"
      businessId: string
      orderId: string
      at: string
      total?: string
      currency?: string
    }
  | {
      type: "order.status_changed"
      businessId: string
      orderId: string
      status: string
      at: string
    }

export function isAdminOrderRealtimePayload(
  value: unknown,
): value is AdminOrderRealtimePayload {
  if (!value || typeof value !== "object") return false
  const o = value as Record<string, unknown>
  const t = o.type
  if (t === "order.created") {
    return (
      typeof o.businessId === "string" &&
      typeof o.orderId === "string" &&
      typeof o.at === "string"
    )
  }
  if (t === "order.status_changed") {
    return (
      typeof o.businessId === "string" &&
      typeof o.orderId === "string" &&
      typeof o.status === "string" &&
      typeof o.at === "string"
    )
  }
  return false
}

/**
 * Alineado con el backend (`AdminReservationRealtimePayload`).
 * Evento único: `admin:reservation` con discriminador `type`.
 */
export type AdminReservationRealtimePayload =
  | {
      type: "reservation.created"
      businessId: string
      reservationId: string
      at: string
    }
  | {
      type: "reservation.cancelled"
      businessId: string
      reservationId: string
      status: string
      at: string
    }
  | {
      type: "reservation.edit_started"
      businessId: string
      reservationId: string
      at: string
    }

export function isAdminReservationRealtimePayload(
  value: unknown,
): value is AdminReservationRealtimePayload {
  if (!value || typeof value !== "object") return false
  const o = value as Record<string, unknown>
  const t = o.type
  if (t === "reservation.created") {
    return (
      typeof o.businessId === "string" &&
      typeof o.reservationId === "string" &&
      typeof o.at === "string"
    )
  }
  if (t === "reservation.cancelled") {
    return (
      typeof o.businessId === "string" &&
      typeof o.reservationId === "string" &&
      typeof o.status === "string" &&
      typeof o.at === "string"
    )
  }
  if (t === "reservation.edit_started") {
    return (
      typeof o.businessId === "string" &&
      typeof o.reservationId === "string" &&
      typeof o.at === "string"
    )
  }
  return false
}

export interface AdminWhatsappRealtimePayload {
  type: "whatsapp.message_created"
  businessId: string
  conversationId: string
  messageId: string
  sender: string
  message: string
  isAiGenerated: boolean
  createdAt: string
}

export function isAdminWhatsappRealtimePayload(
  value: unknown,
): value is AdminWhatsappRealtimePayload {
  if (!value || typeof value !== "object") return false
  const o = value as Record<string, unknown>
  return (
    o.type === "whatsapp.message_created" &&
    typeof o.businessId === "string" &&
    typeof o.conversationId === "string" &&
    typeof o.messageId === "string" &&
    typeof o.sender === "string" &&
    typeof o.message === "string" &&
    typeof o.isAiGenerated === "boolean" &&
    typeof o.createdAt === "string"
  )
}
