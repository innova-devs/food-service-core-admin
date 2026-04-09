"use client"

import { useEffect, useRef } from "react"
import { Edit2, Pentagon, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DeliveryZone } from "./types"

interface ZonesListProps {
  zones: DeliveryZone[]
  selectedZoneId: string | null
  onSelectZone: (zoneId: string) => void
  onEditZone: (zone: DeliveryZone) => void
  onEditZonePolygon: (zone: DeliveryZone) => void
  onDeleteZone: (zone: DeliveryZone) => void
}

export function ZonesList({
  zones,
  selectedZoneId,
  onSelectZone,
  onEditZone,
  onEditZonePolygon,
  onDeleteZone,
}: ZonesListProps) {
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    if (!selectedZoneId) return
    const el = itemRefs.current[selectedZoneId]
    if (!el) return
    el.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    })
  }, [selectedZoneId])

  return (
    <div className="min-h-0 flex-1 overflow-y-auto pr-1">
      <div className="flex flex-col gap-2 p-1">
        {zones.map((zone) => (
          <ZoneItem
            key={zone.id}
            zone={zone}
            isSelected={selectedZoneId === zone.id}
            containerRef={(el) => {
              itemRefs.current[zone.id] = el
            }}
            onSelect={() => onSelectZone(zone.id)}
            onEdit={() => onEditZone(zone)}
            onEditPolygon={() => onEditZonePolygon(zone)}
            onDelete={() => onDeleteZone(zone)}
          />
        ))}
      </div>
    </div>
  )
}

interface ZoneItemProps {
  zone: DeliveryZone
  isSelected: boolean
  containerRef: (el: HTMLDivElement | null) => void
  onSelect: () => void
  onEdit: () => void
  onEditPolygon: () => void
  onDelete: () => void
}

function ZoneItem({
  zone,
  isSelected,
  containerRef,
  onSelect,
  onEdit,
  onEditPolygon,
  onDelete,
}: ZoneItemProps) {
  const fee = zone.deliveryFee.toLocaleString("es-AR")
  const min = zone.minOrderAmount.toLocaleString("es-AR")

  return (
    <div
      ref={containerRef}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onSelect()
        }
      }}
      className={`flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors cursor-pointer ${
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border hover:bg-muted/50"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <p className="truncate font-medium">{zone.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            Envio ${fee} - Min. ${min}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={(e) => {
            e.stopPropagation()
            onEditPolygon()
          }}
          aria-label={`Editar poligono de ${zone.name}`}
          title="Editar poligono"
        >
          <Pentagon className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
          aria-label={`Editar zona ${zone.name}`}
          title="Editar datos"
        >
          <Edit2 className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-destructive hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          aria-label={`Eliminar zona ${zone.name}`}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  )
}
