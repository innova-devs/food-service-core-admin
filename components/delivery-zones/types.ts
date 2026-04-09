export interface DeliveryZone {
  id: string
  businessId: string
  name: string
  description: string | null
  deliveryFee: number
  minOrderAmount: number
  estimatedDeliveryMinutes: number
  scheduleOverride: unknown | null
  priority: number
  isActive: boolean
  polygon: GeoJSON.Polygon
  createdAt: string
  updatedAt: string
}

export interface ZoneFormData {
  name: string
  description: string
  deliveryFee: number
  minOrderAmount: number
  estimatedDeliveryMinutes: number
  priority: number
  isActive: boolean
  polygon: GeoJSON.Polygon | null
}

export interface DeliveryZonesMapCenter {
  lat: number
  lng: number
}

export const DEFAULT_MAP_CENTER: [number, number] = [-32.9581675, -60.6383001]
export const DEFAULT_MAP_ZOOM = 12
