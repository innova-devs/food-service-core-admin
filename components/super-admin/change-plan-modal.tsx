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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import type { BusinessWithSubscription, Subscription } from "./types"

interface ChangePlanModalProps {
  business: BusinessWithSubscription | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (plan: Subscription["plan_name"]) => void
}

export function ChangePlanModal({
  business,
  open,
  onOpenChange,
  onConfirm,
}: ChangePlanModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<Subscription["plan_name"]>(
    business?.subscription.plan_name || "Basic",
  )

  useEffect(() => {
    if (open && business) {
      setSelectedPlan(business.subscription.plan_name)
    }
  }, [open, business])

  const handleConfirm = () => {
    onConfirm(selectedPlan)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cambiar plan</DialogTitle>
          <DialogDescription>
            Cambiar el plan de suscripción de {business?.name}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="plan">Seleccionar plan</Label>
            <Select
              value={selectedPlan}
              onValueChange={(value) =>
                setSelectedPlan(value as Subscription["plan_name"])
              }
            >
              <SelectTrigger id="plan" className="w-full">
                <SelectValue placeholder="Elegí un plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Basic">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Basic</span>
                    <span className="text-xs text-muted-foreground">
                      50k tokens / mes
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="Pro">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Pro</span>
                    <span className="text-xs text-muted-foreground">
                      100k tokens / mes
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="Business">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Business</span>
                    <span className="text-xs text-muted-foreground">
                      250k tokens / mes
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>Confirmar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
