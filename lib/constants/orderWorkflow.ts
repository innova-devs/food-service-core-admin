/** Estados operativos de entrega que el admin puede asignar vía PATCH (alineado al backend). */
export const ADMIN_ORDER_DELIVERY_STATUSES = [
  "preparing",
  "shipped",
  "delivered",
] as const

export type AdminOrderDeliveryStatus =
  (typeof ADMIN_ORDER_DELIVERY_STATUSES)[number]

export const ADMIN_ORDER_DELIVERY_LABEL_ES: Record<
  AdminOrderDeliveryStatus,
  string
> = {
  preparing: "En preparación",
  shipped: "Enviado",
  delivered: "Entregado",
}
