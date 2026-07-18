"use client"

import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type {
  DeliveryZoneCalibrationReport,
  DeliveryZoneCalibrationZone,
  ZoneCalibrationAction,
} from "@/lib/requests/delivery-zones"

function formatMoney(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—"
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value)
}

function actionLabel(action: ZoneCalibrationAction): string {
  switch (action) {
    case "increase":
      return "Subir"
    case "keep":
      return "OK"
    case "optional_decrease":
      return "Opcional bajar"
    case "insufficient_data":
      return "Sin datos"
  }
}

function actionVariant(
  action: ZoneCalibrationAction,
): "default" | "secondary" | "destructive" | "outline" {
  switch (action) {
    case "increase":
      return "destructive"
    case "keep":
      return "secondary"
    case "optional_decrease":
      return "outline"
    case "insufficient_data":
      return "outline"
  }
}

function suggestionCell(zone: DeliveryZoneCalibrationZone): string {
  if (zone.suggestedFee == null) return "—"
  if (zone.action === "increase") {
    const delta = zone.suggestedFee - zone.currentFee
    return `${formatMoney(zone.suggestedFee)} (+${formatMoney(delta)})`
  }
  if (zone.action === "keep") {
    return "Sin aumento"
  }
  if (zone.action === "optional_decrease") {
    return `${formatMoney(zone.suggestedFee)} (opcional)`
  }
  return "—"
}

function canApply(zone: DeliveryZoneCalibrationZone): boolean {
  return (
    zone.suggestedFee != null &&
    Number.isFinite(zone.suggestedFee) &&
    zone.suggestedFee !== zone.currentFee
  )
}

interface CalibrationResultModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  report: DeliveryZoneCalibrationReport | null
  applyingZoneId: string | null
  onApply: (zone: DeliveryZoneCalibrationZone) => void
}

export function CalibrationResultModal({
  open,
  onOpenChange,
  report,
  applyingZoneId,
  onApply,
}: CalibrationResultModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col gap-4 overflow-hidden sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Comparación con PedidosYa</DialogTitle>
          <DialogDescription>
            {report?.disclaimer ??
              "Referencia de tarifas PedidosYa vs tus fees planas por zona."}
          </DialogDescription>
        </DialogHeader>

        {report ? (
          <div className="min-h-0 flex-1 overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zona</TableHead>
                  <TableHead className="text-right">Precio actual</TableHead>
                  <TableHead className="text-right">PedidosYa</TableHead>
                  <TableHead>Sugerencia</TableHead>
                  <TableHead className="w-[1%] text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.zones.map((zone) => {
                  const applying = applyingZoneId === zone.zoneId
                  return (
                    <TableRow key={zone.zoneId}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{zone.zoneName}</span>
                          <Badge
                            variant={actionVariant(zone.action)}
                            className="w-fit"
                          >
                            {actionLabel(zone.action)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(zone.currentFee)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(zone.pedidosYa.avg)}
                        {zone.pedidosYa.min != null &&
                        zone.pedidosYa.max != null &&
                        zone.pedidosYa.min !== zone.pedidosYa.max ? (
                          <p className="text-xs text-muted-foreground">
                            {formatMoney(zone.pedidosYa.min)} –{" "}
                            {formatMoney(zone.pedidosYa.max)}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className="max-w-[220px] whitespace-normal">
                        <div className="flex flex-col gap-0.5">
                          <span className="tabular-nums">
                            {suggestionCell(zone)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {zone.message}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={
                            zone.action === "increase" ? "default" : "outline"
                          }
                          disabled={!canApply(zone) || applyingZoneId != null}
                          onClick={() => onApply(zone)}
                        >
                          {applying ? (
                            <>
                              <Loader2 className="size-3.5 animate-spin" />
                              Aplicando…
                            </>
                          ) : (
                            "Aplicar"
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        ) : null}

        <DialogFooter className="shrink-0 sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Colchón {report?.safetyBufferPercent ?? 15}% · Solo actualiza el fee
            de la zona elegida
          </p>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
