import { redirect } from "next/navigation"

import { SUPER_ADMIN_HOME } from "@/lib/access-control"

export default function SuperAdminIndexPage() {
  redirect(SUPER_ADMIN_HOME)
}
