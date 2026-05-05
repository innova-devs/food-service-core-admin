"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { OrderVolumeChart } from "./order-volume-chart"
import { ClientRankingTable } from "./client-ranking-table"
import { TopDishesTable } from "./top-dishes-table"

export function AnalyticsTabs() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Analíticas</h2>
        <p className="text-sm text-muted-foreground">
          Tendencias del período · datos de demo
        </p>
      </div>
      <Separator />
      <Tabs defaultValue="volume">
        <TabsList className="mb-4">
          <TabsTrigger value="volume">Volumen de pedidos</TabsTrigger>
          <TabsTrigger value="clients">Ranking de clientes</TabsTrigger>
          <TabsTrigger value="dishes">Platos top</TabsTrigger>
        </TabsList>
        <TabsContent value="volume">
          <OrderVolumeChart />
        </TabsContent>
        <TabsContent value="clients">
          <ClientRankingTable />
        </TabsContent>
        <TabsContent value="dishes">
          <TopDishesTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}
