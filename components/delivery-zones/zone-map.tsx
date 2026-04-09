"use client"

import { useEffect, useRef, useCallback } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet-draw/dist/leaflet.draw.css"
import "leaflet-draw"
import type { DeliveryZone } from "./types"
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "./types"

interface ZoneMapProps {
  zones: DeliveryZone[]
  mapCenter: { lat: number; lng: number } | null
  selectedZoneId: string | null
  isDrawing: boolean
  onPolygonDrawn: (polygon: GeoJSON.Polygon) => void
  onSelectZone: (zoneId: string) => void
  editingZone: DeliveryZone | null
}

export function ZoneMap({
  zones,
  mapCenter,
  selectedZoneId,
  isDrawing,
  onPolygonDrawn,
  onSelectZone,
  editingZone,
}: ZoneMapProps) {
  const getZoneColor = useCallback((zoneId: string) => {
    const palette = ["#3b82f6", "#22c55e", "#f97316", "#ef4444", "#a855f7", "#14b8a6"]
    let hash = 0
    for (let i = 0; i < zoneId.length; i += 1) {
      hash = zoneId.charCodeAt(i) + ((hash << 5) - hash)
    }
    return palette[Math.abs(hash) % palette.length]
  }, [])

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const zonesLayerRef = useRef<L.FeatureGroup | null>(null)
  const drawLayerRef = useRef<L.FeatureGroup | null>(null)
  const drawControlRef = useRef<L.Control.Draw | null>(null)

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: DEFAULT_MAP_CENTER,
      zoom: DEFAULT_MAP_ZOOM,
    })

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)

    // Layer for existing zones
    const zonesLayer = new L.FeatureGroup()
    map.addLayer(zonesLayer)
    zonesLayerRef.current = zonesLayer

    // Layer for drawing new zones
    const drawLayer = new L.FeatureGroup()
    map.addLayer(drawLayer)
    drawLayerRef.current = drawLayer

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
      zonesLayerRef.current = null
      drawLayerRef.current = null
    }
  }, [])

  // Handle draw control based on isDrawing state
  useEffect(() => {
    const map = mapRef.current
    const drawLayer = drawLayerRef.current
    if (!map || !drawLayer) return

    // Remove existing draw control if any
    if (drawControlRef.current) {
      map.removeControl(drawControlRef.current)
      drawControlRef.current = null
    }

    // Clear draw layer
    drawLayer.clearLayers()

    if (isDrawing) {
      const drawControl = new L.Control.Draw({
        draw: {
          polygon: {
            allowIntersection: false,
            showArea: true,
            shapeOptions: {
              color: "#3b82f6",
              weight: 2,
              fillOpacity: 0.3,
            },
          },
          polyline: false,
          rectangle: false,
          circle: false,
          marker: false,
          circlemarker: false,
        },
        edit: {
          featureGroup: drawLayer,
          remove: true,
        },
      })

      map.addControl(drawControl)
      drawControlRef.current = drawControl

      if (editingZone?.polygon) {
        const editableLayer = L.geoJSON(editingZone.polygon)
        editableLayer.eachLayer((layer) => {
          drawLayer.addLayer(layer)
        })
      }

      // Handle draw events
      const handleCreated = (e: L.LeafletEvent) => {
        const event = e as L.DrawEvents.Created
        const layer = event.layer as L.Polygon

        // Clear previous drawings
        drawLayer.clearLayers()
        drawLayer.addLayer(layer)

        // Convert to GeoJSON
        const geoJson = layer.toGeoJSON()
        if (geoJson.geometry.type === "Polygon") {
          onPolygonDrawn(geoJson.geometry as GeoJSON.Polygon)
        }
      }

      const handleEdited = (e: L.LeafletEvent) => {
        const event = e as L.DrawEvents.Edited
        event.layers.eachLayer((layer) => {
          const geoJson = (layer as L.Polygon).toGeoJSON()
          if (geoJson.geometry.type === "Polygon") {
            onPolygonDrawn(geoJson.geometry as GeoJSON.Polygon)
          }
        })
      }

      map.on(L.Draw.Event.CREATED, handleCreated)
      map.on(L.Draw.Event.EDITED, handleEdited)

      return () => {
        map.off(L.Draw.Event.CREATED, handleCreated)
        map.off(L.Draw.Event.EDITED, handleEdited)
        if (drawControlRef.current) {
          map.removeControl(drawControlRef.current)
          drawControlRef.current = null
        }
      }
    }
  }, [isDrawing, onPolygonDrawn, editingZone])

  // Render zones on the map
  const renderZones = useCallback(() => {
    const zonesLayer = zonesLayerRef.current
    if (!zonesLayer) return

    zonesLayer.clearLayers()

    zones.forEach((zone) => {
      // Skip the zone being edited (it will be shown in drawLayer)
      if (editingZone?.id === zone.id) return

      const polygon = L.geoJSON(zone.polygon, {
        style: {
          color: getZoneColor(zone.id),
          weight: selectedZoneId === zone.id ? 3 : 2,
          fillColor: getZoneColor(zone.id),
          fillOpacity: selectedZoneId === zone.id ? 0.4 : 0.2,
        },
      })

      polygon.on("click", () => {
        onSelectZone(zone.id)
      })

      // Add tooltip with zone name
      polygon.bindTooltip(zone.name, {
        permanent: false,
        direction: "center",
        className: "zone-tooltip",
      })

      zonesLayer.addLayer(polygon)
    })
  }, [zones, selectedZoneId, onSelectZone, editingZone, getZoneColor])

  useEffect(() => {
    renderZones()
  }, [renderZones])

  // Fit bounds when zones change or when selecting a zone
  useEffect(() => {
    const map = mapRef.current
    const zonesLayer = zonesLayerRef.current
    if (!map || !zonesLayer) return

    if (!selectedZoneId && zones.length === 0 && mapCenter) {
      map.setView([mapCenter.lat, mapCenter.lng], DEFAULT_MAP_ZOOM)
      return
    }

    if (selectedZoneId) {
      const zone = zones.find((z) => z.id === selectedZoneId)
      if (zone) {
        const bounds = L.geoJSON(zone.polygon).getBounds()
        map.fitBounds(bounds, { padding: [50, 50] })
      }
    } else if (zones.length > 0) {
      const bounds = zonesLayer.getBounds()
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] })
      }
    }
  }, [selectedZoneId, zones, mapCenter])

  return (
    <div
      ref={mapContainerRef}
      className="delivery-zones-map size-full min-h-[400px] relative z-0"
    />
  )
}
