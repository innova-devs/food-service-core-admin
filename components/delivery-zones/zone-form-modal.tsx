"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { type DeliveryZone, type ZoneFormData } from "./types"

interface ZoneFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  zone: DeliveryZone | null
  drawnPolygon: GeoJSON.Polygon | null
  onSave: (data: ZoneFormData) => void
  isSaving: boolean
}

export function ZoneFormModal({
  open,
  onOpenChange,
  zone,
  drawnPolygon,
  onSave,
  isSaving,
}: ZoneFormModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [deliveryFee, setDeliveryFee] = useState("0")
  const [minOrderAmount, setMinOrderAmount] = useState("0")
  const [estimatedDeliveryMinutes, setEstimatedDeliveryMinutes] = useState("30")
  const [priority, setPriority] = useState("10")
  const [isActive, setIsActive] = useState(true)

  const isEditing = !!zone

  useEffect(() => {
    if (open) {
      if (zone) {
        setName(zone.name)
        setDescription(zone.description ?? "")
        setDeliveryFee(String(zone.deliveryFee))
        setMinOrderAmount(String(zone.minOrderAmount))
        setEstimatedDeliveryMinutes(String(zone.estimatedDeliveryMinutes))
        setPriority(String(zone.priority))
        setIsActive(zone.isActive)
      } else {
        setName("")
        setDescription("")
        setDeliveryFee("0")
        setMinOrderAmount("0")
        setEstimatedDeliveryMinutes("30")
        setPriority("10")
        setIsActive(true)
      }
    }
  }, [open, zone])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const polygon = drawnPolygon ?? zone?.polygon ?? null
    
    if (!name.trim()) {
      return
    }

    if (!polygon) {
      return
    }

    const fee = Number(deliveryFee)
    const min = Number(minOrderAmount)
    const eta = Number(estimatedDeliveryMinutes)
    const prio = Number(priority)
    if (
      !Number.isFinite(fee) ||
      !Number.isFinite(min) ||
      !Number.isFinite(eta) ||
      !Number.isFinite(prio)
    ) {
      return
    }

    onSave({
      name: name.trim(),
      description,
      deliveryFee: fee,
      minOrderAmount: min,
      estimatedDeliveryMinutes: eta,
      priority: prio,
      isActive,
      polygon,
    })
  }

  const polygon = drawnPolygon ?? zone?.polygon ?? null
  const canSave = name.trim() && polygon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar zona de entrega" : "Nueva zona de entrega"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los datos de la zona."
              : "Configura los datos para la nueva zona."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="zone-name">Nombre de la zona</Label>
              <Input
                id="zone-name"
                placeholder="Ej: Centro Historico"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="zone-description">Descripcion (opcional)</Label>
              <Textarea
                id="zone-description"
                placeholder="Cobertura principal"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="zone-fee">Costo de envio</Label>
                <Input
                  id="zone-fee"
                  type="number"
                  min={0}
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="zone-min">Pedido minimo</Label>
                <Input
                  id="zone-min"
                  type="number"
                  min={0}
                  value={minOrderAmount}
                  onChange={(e) => setMinOrderAmount(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="zone-eta">Minutos estimados</Label>
                <Input
                  id="zone-eta"
                  type="number"
                  min={1}
                  value={estimatedDeliveryMinutes}
                  onChange={(e) => setEstimatedDeliveryMinutes(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="zone-priority">Prioridad</Label>
                <Input
                  id="zone-priority"
                  type="number"
                  min={0}
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label htmlFor="zone-active">Zona activa</Label>
              <Switch
                id="zone-active"
                checked={isActive}
                onCheckedChange={setIsActive}
                aria-label="Alternar estado de zona activa"
              />
            </div>
            {!polygon && !isEditing && (
              <p className="text-sm text-muted-foreground">
                Dibuja un poligono en el mapa para definir la zona.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!canSave || isSaving}>
              {isSaving ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear zona"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
