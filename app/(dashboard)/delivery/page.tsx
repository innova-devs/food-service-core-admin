"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { isAxiosError } from "axios"
import { ScanLineIcon, TruckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OrdersList } from "@/components/delivery/orders-list"
import { PermissionModal } from "@/components/delivery/permission-modal"
import { DeliveryQrScanner } from "@/components/delivery/delivery-qr-scanner"
import { ResultModal } from "@/components/delivery/result-modal"
import type { DeliveryOrder, DeliveryOrderItem } from "@/components/delivery/order-card"
import {
  confirmDeliveryByQr,
  fetchAdminOrders,
  mapAdminOrderToOrder,
} from "@/lib/requests/orders"
import { summarizeDeliverySnapshot, type Order } from "@/lib/data"

// Mock data for delivery orders
const mockOrders: DeliveryOrder[] = [
  {
    id: "ORD-001",
    customerName: "Maria Garcia",
    customerPhone: "+52 55 1111 1111",
    address: "Av. Insurgentes Sur 1234, Col. Del Valle, CDMX",
    totalPrice: 245.50,
    status: "out_for_delivery",
    items: [
      { id: "item-1", name: "Hamburguesa clasica", quantity: 2 },
      { id: "item-2", name: "Papas fritas", quantity: 1 },
    ],
  },
  {
    id: "ORD-002",
    customerName: "Carlos Rodriguez",
    customerPhone: "+52 55 2222 2222",
    address: "Calle Reforma 567, Col. Juarez, CDMX",
    totalPrice: 189.00,
    status: "out_for_delivery",
    items: [
      { id: "item-3", name: "Pizza pepperoni", quantity: 1 },
      { id: "item-4", name: "Refresco", quantity: 2 },
    ],
  },
  {
    id: "ORD-003",
    customerName: "Ana Martinez",
    customerPhone: "+52 55 3333 3333",
    address: "Blvd. Miguel de Cervantes 890, Col. Granada, CDMX",
    totalPrice: 312.75,
    status: "pending",
    items: [
      { id: "item-5", name: "Sushi mix", quantity: 2 },
      { id: "item-6", name: "Sopa miso", quantity: 2 },
    ],
  },
  {
    id: "ORD-004",
    customerName: "Jose Lopez",
    customerPhone: "+52 55 4444 4444",
    address: "Av. Revolucion 234, Col. San Angel, CDMX",
    totalPrice: 156.25,
    status: "out_for_delivery",
    items: [{ id: "item-7", name: "Tacos al pastor", quantity: 3 }],
  },
]

type DeliveryFlow =
  | { step: "idle" }
  | { step: "permission" }
  | { step: "scanning" }
  | { step: "result"; success: boolean; scannedOrder?: DeliveryOrder }

function monthBoundsISO() {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  }
}

function mapOrderToDeliveryOrder(order: Order): DeliveryOrder {
  const status: DeliveryOrder["status"] =
    order.status === "delivered"
      ? "delivered"
      : order.status === "shipped"
        ? "out_for_delivery"
        : "pending"

  const items: DeliveryOrderItem[] = order.items.map((item) => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
  }))

  return {
    id: order.id,
    customerName: order.customer.name?.trim() || "Cliente sin nombre",
    customerPhone: order.customer.phoneNumber || "Telefono no disponible",
    address: summarizeDeliverySnapshot(order.deliveryAddressSnapshot) || "Direccion no disponible",
    totalPrice: order.totalAmount ?? 0,
    status,
    items,
  }
}

export default function DeliveryPage() {
  const bounds = monthBoundsISO()
  const [orders, setOrders] = useState<DeliveryOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [flow, setFlow] = useState<DeliveryFlow>({ step: "idle" })
  const [isRequesting, setIsRequesting] = useState(false)
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [activeTab, setActiveTab] = useState<"pending" | "delivered">("pending")

  // Load orders
  const loadOrders = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchAdminOrders({
        page: 1,
        dateFrom: bounds.from,
        dateTo: bounds.to,
        // Usamos el mismo servicio de pedidos; luego segmentamos por estado.
        status: undefined,
      })
      const mapped = data.items
        .map(mapAdminOrderToOrder)
        .map(mapOrderToDeliveryOrder)
        .filter((order) => order.status === "out_for_delivery" || order.status === "delivered")
      setOrders(mapped)
    } catch (e) {
      setOrders(
        mockOrders.filter((o) => o.status === "out_for_delivery" || o.status === "delivered")
      )
      if (isAxiosError(e)) {
        const msg = (e.response?.data as { message?: string })?.message ?? e.message
        setError(
          typeof msg === "string" && msg
            ? msg
            : "No se pudieron cargar los pedidos. Por favor, intenta de nuevo.",
        )
      } else {
        setError("No se pudieron cargar los pedidos. Por favor, intenta de nuevo.")
      }
    } finally {
      setIsLoading(false)
    }
  }, [bounds.from, bounds.to])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  const handleStartScan = () => {
    setPermissionError(null)
    setFlow({ step: "permission" })
  }

  // Request camera permission
  const handleRequestPermission = async () => {
    if (flow.step !== "permission") return

    setIsRequesting(true)
    setPermissionError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      // Stop the stream immediately, we just needed to check permission
      stream.getTracks().forEach((track) => track.stop())
      // Move to scanning
      setFlow({ step: "scanning" })
    } catch (err) {
      const error = err as Error
      if (error.name === "NotAllowedError") {
        setPermissionError("Permiso de camara denegado. Habilita el acceso en la configuracion de tu navegador.")
      } else {
        setPermissionError(error.message || "Error al acceder a la camara.")
      }
    } finally {
      setIsRequesting(false)
    }
  }

  // Handle QR scan
  const handleScan = async (data: string) => {
    if (flow.step !== "scanning") return

    setIsProcessing(true)
    setError(null)

    try {
      const result = await confirmDeliveryByQr(data)
      const orderId = result.order?.id ?? result.orderId
      if (result.order) {
        const mappedOrder = mapOrderToDeliveryOrder(result.order)
        setOrders((prev) => {
          const withoutCurrent = prev.filter((order) => order.id !== mappedOrder.id)
          return [mappedOrder, ...withoutCurrent]
        })
      } else if (orderId) {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId ? { ...order, status: "delivered" } : order
          )
        )
      } else {
        await loadOrders()
      }
      setFlow({
        step: "result",
        success: true,
        scannedOrder: result.order ? mapOrderToDeliveryOrder(result.order) : undefined,
      })
      setActiveTab("delivered")
    } catch (err) {
      if (isAxiosError(err)) {
        const msg = (err.response?.data as { message?: string })?.message ?? err.message
        setError(
          typeof msg === "string" && msg
            ? msg
            : "No se pudo marcar la entrega con el QR escaneado.",
        )
      } else {
        setError("No se pudo marcar la entrega con el QR escaneado.")
      }
      setFlow({ step: "result", success: false })
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle scan cancel
  const handleScanCancel = () => {
    setFlow({ step: "idle" })
  }

  // Handle confirm delivery
  const handleConfirmDelivery = async () => {
    if (flow.step !== "result" || !flow.success) return

    setIsConfirming(true)
    await new Promise((resolve) => setTimeout(resolve, 300))
    setIsConfirming(false)
    setFlow({ step: "idle" })
  }

  // Handle try again
  const handleTryAgain = () => {
    if (flow.step !== "result") return
    setFlow({ step: "scanning" })
  }

  // Close modals
  const handleClosePermission = (open: boolean) => {
    if (!open) {
      setFlow({ step: "idle" })
      setPermissionError(null)
    }
  }

  const handleCloseResult = (open: boolean) => {
    if (!open) {
      setFlow({ step: "idle" })
    }
  }

  const pendingOrders = useMemo(
    () => orders.filter((order) => order.status === "out_for_delivery"),
    [orders]
  )
  const deliveredOrders = useMemo(
    () => orders.filter((order) => order.status === "delivered"),
    [orders]
  )

  return (
    <div className="flex flex-col min-h-screen">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "pending" | "delivered")}
        className="flex-1"
      >
        {/* Header */}
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex min-h-16 items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <TruckIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Mis entregas</h1>
                <p className="text-xs text-muted-foreground">
                  {pendingOrders.length} pedidos pendientes
                </p>
              </div>
            </div>
            <Button onClick={handleStartScan} size="sm" className="h-10">
              <ScanLineIcon className="h-4 w-4" />
              Escanear QR
            </Button>
          </div>
          <div className="px-4 pb-3">
            <TabsList>
              <TabsTrigger value="pending">Pendientes por entregar ({pendingOrders.length})</TabsTrigger>
              <TabsTrigger value="delivered">Entregados ({deliveredOrders.length})</TabsTrigger>
            </TabsList>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4">
          <TabsContent value="pending">
            <OrdersList
              orders={pendingOrders}
              isLoading={isLoading}
              error={error}
              onRetry={loadOrders}
            />
          </TabsContent>
          <TabsContent value="delivered">
            <OrdersList
              orders={deliveredOrders}
              isLoading={isLoading}
              error={error}
              onRetry={loadOrders}
            />
          </TabsContent>
        </main>
      </Tabs>

      {/* Permission Modal */}
      <PermissionModal
        open={flow.step === "permission"}
        onOpenChange={handleClosePermission}
        onRequestPermission={handleRequestPermission}
        isRequesting={isRequesting}
        error={permissionError}
        onRetry={handleRequestPermission}
      />

      {/* QR Scanner (Full screen) */}
      {flow.step === "scanning" && (
        <DeliveryQrScanner
          onScan={handleScan}
          onCancel={handleScanCancel}
          isProcessing={isProcessing}
        />
      )}

      {/* Result Modal */}
      <ResultModal
        open={flow.step === "result"}
        onOpenChange={handleCloseResult}
        success={flow.step === "result" ? flow.success : false}
        order={flow.step === "result" ? flow.scannedOrder : null}
        onConfirm={handleConfirmDelivery}
        onTryAgain={handleTryAgain}
        isConfirming={isConfirming}
      />
    </div>
  )
}
