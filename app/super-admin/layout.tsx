import { DashboardLayoutClient } from "@/components/dashboard-layout-client"

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardLayoutClient variant="super-admin">{children}</DashboardLayoutClient>
  )
}
