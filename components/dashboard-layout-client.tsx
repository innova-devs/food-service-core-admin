"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Header } from "@/components/header"
import { AdminSocketProvider } from "@/contexts/admin-socket-context"

export function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AdminSocketProvider>
          <Header />
          <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
        </AdminSocketProvider>
      </SidebarInset>
    </SidebarProvider>
  )
}
