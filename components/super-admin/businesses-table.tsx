"use client"

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { BusinessRow } from "./business-row"
import type { BusinessWithSubscription } from "./types"

interface BusinessesTableProps {
  businesses: BusinessWithSubscription[]
  onViewDetails: (business: BusinessWithSubscription) => void
  onChangePlan: (business: BusinessWithSubscription) => void
  onExtendSubscription: (business: BusinessWithSubscription) => void
  onToggleBlock: (business: BusinessWithSubscription) => void
  onResetTokens: (business: BusinessWithSubscription) => void
}

export function BusinessesTable({
  businesses,
  onViewDetails,
  onChangePlan,
  onExtendSubscription,
  onToggleBlock,
  onResetTokens,
}: BusinessesTableProps) {
  if (businesses.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        No hay negocios para mostrar
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Negocio</TableHead>
          <TableHead>Plan</TableHead>
          <TableHead>Tokens (uso / límite)</TableHead>
          <TableHead>Uso</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Fin de suscripción</TableHead>
          <TableHead className="w-12">
            <span className="sr-only">Acciones</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {businesses.map((business) => (
          <BusinessRow
            key={business.id}
            business={business}
            onViewDetails={() => onViewDetails(business)}
            onChangePlan={() => onChangePlan(business)}
            onExtendSubscription={() => onExtendSubscription(business)}
            onToggleBlock={() => onToggleBlock(business)}
            onResetTokens={() => onResetTokens(business)}
          />
        ))}
      </TableBody>
    </Table>
  )
}
