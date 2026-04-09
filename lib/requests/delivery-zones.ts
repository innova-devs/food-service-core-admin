import { api } from "@/lib/api"
import type {
  DeliveryZone,
  DeliveryZonesMapCenter,
  ZoneFormData,
} from "@/components/delivery-zones/types"

export const ADMIN_DELIVERY_ZONES_PATH = "/admin/delivery-zones"

interface DeliveryZoneRaw {
  id?: string
  businessId?: string
  business_id?: string
  name?: string | null
  description?: string | null
  deliveryFee?: number | null
  delivery_fee?: number | null
  minOrderAmount?: number | null
  min_order_amount?: number | null
  estimatedDeliveryMinutes?: number | null
  estimated_delivery_minutes?: number | null
  scheduleOverride?: unknown | null
  schedule_override?: unknown | null
  priority?: number | null
  isActive?: boolean | null
  is_active?: boolean | null
  polygon?: GeoJSON.Polygon | null
  createdAt?: string | null
  created_at?: string | null
  updatedAt?: string | null
  updated_at?: string | null
}

interface DeliveryZonesListResponseRaw {
  items?: DeliveryZoneRaw[]
  total?: number
  mapCenter?: {
    lat?: number
    lng?: number
  } | null
}

export interface DeliveryZonesListResponse {
  items: DeliveryZone[]
  total: number
  mapCenter: DeliveryZonesMapCenter | null
}

interface DeleteDeliveryZoneResponseRaw {
  success?: boolean
  id?: string
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value
  return fallback
}

function mapDeliveryZone(raw: DeliveryZoneRaw): DeliveryZone {
  return {
    id: String(raw.id ?? ""),
    businessId: String(raw.businessId ?? raw.business_id ?? ""),
    name: String(raw.name ?? ""),
    description: typeof raw.description === "string" ? raw.description : null,
    deliveryFee: toNumber(raw.deliveryFee ?? raw.delivery_fee),
    minOrderAmount: toNumber(raw.minOrderAmount ?? raw.min_order_amount),
    estimatedDeliveryMinutes: toNumber(
      raw.estimatedDeliveryMinutes ?? raw.estimated_delivery_minutes,
    ),
    scheduleOverride: raw.scheduleOverride ?? raw.schedule_override ?? null,
    priority: toNumber(raw.priority),
    isActive:
      typeof (raw.isActive ?? raw.is_active) === "boolean"
        ? Boolean(raw.isActive ?? raw.is_active)
        : true,
    polygon:
      raw.polygon?.type === "Polygon"
        ? raw.polygon
        : { type: "Polygon", coordinates: [] },
    createdAt: String(raw.createdAt ?? raw.created_at ?? new Date().toISOString()),
    updatedAt: String(raw.updatedAt ?? raw.updated_at ?? new Date().toISOString()),
  }
}

function toPayload(input: ZoneFormData): Record<string, unknown> {
  return {
    name: input.name,
    description: input.description.trim() ? input.description.trim() : null,
    polygon: input.polygon,
    deliveryFee: input.deliveryFee,
    minOrderAmount: input.minOrderAmount,
    estimatedDeliveryMinutes: input.estimatedDeliveryMinutes,
    scheduleOverride: null,
    priority: input.priority,
    isActive: input.isActive,
  }
}

export async function fetchAdminDeliveryZones(): Promise<DeliveryZonesListResponse> {
  const { data } = await api.get<DeliveryZonesListResponseRaw>(ADMIN_DELIVERY_ZONES_PATH)
  return {
    items: Array.isArray(data.items) ? data.items.map(mapDeliveryZone) : [],
    total: Number.isFinite(data.total) ? Number(data.total) : 0,
    mapCenter:
      data.mapCenter &&
      typeof data.mapCenter.lat === "number" &&
      typeof data.mapCenter.lng === "number"
        ? { lat: data.mapCenter.lat, lng: data.mapCenter.lng }
        : null,
  }
}

export async function fetchAdminDeliveryZoneById(id: string): Promise<DeliveryZone> {
  const { data } = await api.get<DeliveryZoneRaw>(`${ADMIN_DELIVERY_ZONES_PATH}/${id}`)
  return mapDeliveryZone(data)
}

export async function createAdminDeliveryZone(
  input: ZoneFormData,
): Promise<DeliveryZone> {
  const { data } = await api.post<DeliveryZoneRaw>(
    ADMIN_DELIVERY_ZONES_PATH,
    toPayload(input),
  )
  return mapDeliveryZone(data)
}

export async function patchAdminDeliveryZone(
  id: string,
  input: ZoneFormData,
): Promise<DeliveryZone> {
  const { data } = await api.patch<DeliveryZoneRaw>(
    `${ADMIN_DELIVERY_ZONES_PATH}/${id}`,
    toPayload(input),
  )
  return mapDeliveryZone(data)
}

export async function deleteAdminDeliveryZone(id: string): Promise<string> {
  const { data } = await api.delete<DeleteDeliveryZoneResponseRaw>(
    `${ADMIN_DELIVERY_ZONES_PATH}/${id}`,
  )
  return typeof data.id === "string" ? data.id : id
}
