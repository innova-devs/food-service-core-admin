"use client"

import { useState } from "react"
import { MoreHorizontal, Eye, RefreshCw, Package } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@/components/ui/empty"
import { Badge } from "@/components/ui/badge"
import { OrderStatusBadge } from "@/components/status-badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  formatOrderMoney,
  formatShortOrderId,
  orderCustomerLabel,
  summarizeDeliverySnapshot,
  type Order,
} from "@/lib/data"

interface OrdersTableProps {
  orders: Order[]
  isLoading?: boolean
  /** Filas recibidas por Socket.IO: fondo suave + badge “Nuevo”. */
  highlightOrderIds?: string[]
}

const STATUS_OPTIONS = [
  "draft",
  "confirmed",
  "preparing",
  "delivered",
  "cancelled",
] as const

const STATUS_LABEL_ES: Record<(typeof STATUS_OPTIONS)[number], string> = {
  draft: "Borrador",
  confirmed: "Confirmado",
  preparing: "En preparación",
  delivered: "Entregado",
  cancelled: "Cancelado",
}

export function OrdersTable({
  orders,
  isLoading,
  highlightOrderIds = [],
}: OrdersTableProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order)
    setDetailsOpen(true)
  }

  const handleStatusChange = (orderId: string, newStatus: string) => {
    console.log(`Changing order ${orderId} status to ${newStatus}`)
  }

  const formatMoney = (amount: number | null, currencyCode: string) =>
    formatOrderMoney(amount, currencyCode)

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-AR", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  if (isLoading) {
    return <OrdersTableSkeleton />
  }

  if (orders.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Package />
          </EmptyMedia>
          <EmptyTitle>No hay pedidos</EmptyTitle>
          <EmptyDescription>
            No hay pedidos que coincidan con tu búsqueda.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N.º de pedido</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => {
              const isNew = highlightOrderIds.includes(order.id)
              return (
              <TableRow
                key={order.id}
                className={cn(
                  isNew &&
                    "bg-emerald-500/[0.07] transition-colors dark:bg-emerald-500/10",
                )}
              >
                <TableCell className="max-w-[9rem] font-mono text-xs font-medium">
                  <div className="flex flex-wrap items-center gap-2">
                    <span title={order.id}>{formatShortOrderId(order.id)}</span>
                    {isNew ? (
                      <Badge variant="secondary" className="text-[10px] font-normal">
                        Nuevo
                      </Badge>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>{orderCustomerLabel(order.customer)}</TableCell>
                <TableCell>
                  <OrderStatusBadge status={order.status} />
                </TableCell>
                <TableCell>
                  {formatMoney(order.totalAmount, order.currencyCode)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(order.createdAt)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontal className="size-4" />
                        <span className="sr-only">Abrir menú</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleViewDetails(order)}>
                        <Eye className="mr-2 size-4" />
                        Ver detalle
                      </DropdownMenuItem>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <RefreshCw className="mr-2 size-4" />
                          Cambiar estado
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          {STATUS_OPTIONS.map((s) => (
                            <DropdownMenuItem
                              key={s}
                              onClick={() => handleStatusChange(order.id, s)}
                            >
                              {STATUS_LABEL_ES[s]}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-h-[min(90vh,720px)] max-w-2xl overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle del pedido</DialogTitle>
            <DialogDescription>
              Información completa de este pedido.
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="grid gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-sm text-muted-foreground">N.º de pedido</p>
                  <p className="break-all font-mono text-sm font-medium">
                    {selectedOrder.id}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <OrderStatusBadge status={selectedOrder.status} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">
                    {orderCustomerLabel(selectedOrder.customer)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedOrder.customer.phoneNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="font-medium">
                    {formatMoney(
                      selectedOrder.totalAmount,
                      selectedOrder.currencyCode,
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedOrder.currencyCode}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de creación</p>
                  <p className="font-medium">
                    {formatDate(selectedOrder.createdAt)}
                  </p>
                </div>
              </div>

              {summarizeDeliverySnapshot(
                selectedOrder.deliveryAddressSnapshot,
              ) ? (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium leading-none">
                      Dirección de entrega
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {summarizeDeliverySnapshot(
                        selectedOrder.deliveryAddressSnapshot,
                      )}
                    </p>
                  </div>
                </>
              ) : null}

              <Separator />

              <div className="space-y-3">
                <h4 className="text-sm font-medium leading-none">
                  Ítems del pedido
                </h4>
                {selectedOrder.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay ítems en este pedido.
                  </p>
                ) : (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="h-10">Producto</TableHead>
                          <TableHead className="h-10 w-16 text-right">Cant.</TableHead>
                          <TableHead className="h-10 w-14 text-right">
                            Porciones
                          </TableHead>
                          <TableHead className="h-10 w-28 text-right">
                            Precio unit.
                          </TableHead>
                          <TableHead className="h-10 w-28 text-right">
                            Subtotal
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <span className="text-sm font-medium">
                                {item.name}
                              </span>
                              <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                                {item.menuItemId}
                              </p>
                            </TableCell>
                            <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                              {item.servesPeople != null ? item.servesPeople : "—"}
                            </TableCell>
                            <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                              {formatMoney(
                                item.unitPrice,
                                selectedOrder.currencyCode,
                              )}
                            </TableCell>
                            <TableCell className="text-right text-sm font-medium tabular-nums">
                              {formatMoney(
                                item.lineTotal,
                                selectedOrder.currencyCode,
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function OrdersTableSkeleton() {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>N.º de pedido</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead className="w-12">
              <span className="sr-only">Acciones</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-28" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-20 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="size-8" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
