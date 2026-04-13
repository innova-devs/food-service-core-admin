"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { isAxiosError } from "axios"
import { toast } from "sonner"
import { Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { BusinessesTable } from "@/components/super-admin/businesses-table"
import { ChangePlanModal } from "@/components/super-admin/change-plan-modal"
import { ExtendSubscriptionModal } from "@/components/super-admin/extend-subscription-modal"
import { BlockModal } from "@/components/super-admin/block-modal"
import { ResetTokensModal } from "@/components/super-admin/reset-tokens-modal"
import type { BusinessWithSubscription, Subscription } from "@/components/super-admin/types"
import { getBusinessStatus } from "@/components/super-admin/types"
import {
  fetchSuperAdminBusinesses,
} from "@/lib/requests/super-admin-businesses"

const ITEMS_PER_PAGE = 8

export default function BusinessesPage() {
  const router = useRouter()
  const [businesses, setBusinesses] = useState<BusinessWithSubscription[]>([])
  const [total, setTotal] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQ, setDebouncedQ] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [selectedBusiness, setSelectedBusiness] = useState<BusinessWithSubscription | null>(null)
  const [changePlanOpen, setChangePlanOpen] = useState(false)
  const [extendOpen, setExtendOpen] = useState(false)
  const [blockOpen, setBlockOpen] = useState(false)
  const [resetTokensOpen, setResetTokensOpen] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(searchQuery.trim()), 400)
    return () => window.clearTimeout(t)
  }, [searchQuery])

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedQ])

  const loadList = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const { items, total: count } = await fetchSuperAdminBusinesses({
        offset: (currentPage - 1) * ITEMS_PER_PAGE,
        limit: ITEMS_PER_PAGE,
        q: debouncedQ || undefined,
      })
      setBusinesses(items)
      setTotal(count)
    } catch (e) {
      const msg = isAxiosError(e)
        ? (e.response?.data as { message?: string; error?: string })?.message ??
          (e.response?.data as { message?: string; error?: string })?.error ??
          e.message
        : "No se pudieron cargar los negocios."
      setLoadError(typeof msg === "string" && msg ? msg : "No se pudieron cargar los negocios.")
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, debouncedQ])

  useEffect(() => {
    void loadList()
  }, [loadList])

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
  }

  const handleViewDetails = (business: BusinessWithSubscription) => {
    router.push(`/super-admin/businesses/${business.id}`)
  }

  const handleChangePlan = (business: BusinessWithSubscription) => {
    setSelectedBusiness(business)
    setChangePlanOpen(true)
  }

  const handleExtendSubscription = (business: BusinessWithSubscription) => {
    setSelectedBusiness(business)
    setExtendOpen(true)
  }

  const handleToggleBlock = (business: BusinessWithSubscription) => {
    setSelectedBusiness(business)
    setBlockOpen(true)
  }

  const handleResetTokens = (business: BusinessWithSubscription) => {
    setSelectedBusiness(business)
    setResetTokensOpen(true)
  }

  const confirmChangePlan = (plan: Subscription["plan_name"]) => {
    if (!selectedBusiness) return

    const tokenLimits: Record<Subscription["plan_name"], number> = {
      Basic: 50000,
      Pro: 100000,
      Business: 250000,
    }

    setBusinesses((prev) =>
      prev.map((b) =>
        b.id === selectedBusiness.id
          ? {
              ...b,
              ai_monthly_token_limit: tokenLimits[plan],
              subscription: { ...b.subscription, plan_name: plan },
            }
          : b,
      ),
    )
    toast.success(`Plan cambiado a ${plan} para ${selectedBusiness.name}`)
  }

  const confirmExtendSubscription = (newEndDate: Date) => {
    if (!selectedBusiness) return
    setBusinesses((prev) =>
      prev.map((b) =>
        b.id === selectedBusiness.id
          ? {
              ...b,
              subscription: {
                ...b.subscription,
                current_period_end: newEndDate.toISOString(),
              },
            }
          : b,
      ),
    )
    toast.success(`Suscripción extendida para ${selectedBusiness.name}`)
  }

  const confirmToggleBlock = () => {
    if (!selectedBusiness) return
    const wasBlocked = selectedBusiness.ai_blocked
    setBusinesses((prev) =>
      prev.map((b) =>
        b.id === selectedBusiness.id ? { ...b, ai_blocked: !b.ai_blocked } : b,
      ),
    )
    toast.success(
      wasBlocked
        ? `${selectedBusiness.name} fue desbloqueado`
        : `${selectedBusiness.name} fue bloqueado`,
    )
  }

  const confirmResetTokens = () => {
    if (!selectedBusiness) return
    setBusinesses((prev) =>
      prev.map((b) =>
        b.id === selectedBusiness.id ? { ...b, ai_monthly_tokens_used: 0 } : b,
      ),
    )
    toast.success(`Tokens reiniciados para ${selectedBusiness.name}`)
  }

  const selectedStatus = selectedBusiness
    ? getBusinessStatus(selectedBusiness, selectedBusiness.subscription)
    : "Active"

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Negocios</h1>
        <p className="text-muted-foreground">
          Administrá negocios y suscripciones
        </p>
      </div>

      {loadError ? (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <CardTitle className="text-base font-medium">Todos los negocios</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <BusinessesTable
              businesses={businesses}
              onViewDetails={handleViewDetails}
              onChangePlan={handleChangePlan}
              onExtendSubscription={handleExtendSubscription}
              onToggleBlock={handleToggleBlock}
              onResetTokens={handleResetTokens}
            />
          )}
        </CardContent>
      </Card>

      {!isLoading && totalPages > 1 && (
        <Pagination aria-label="Paginación de negocios">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                label="Anterior"
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setCurrentPage((p) => Math.max(1, p - 1))
                }}
                aria-disabled={currentPage === 1}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        setCurrentPage(page)
                      }}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              }
              if (page === currentPage - 2 || page === currentPage + 2) {
                return (
                  <PaginationItem key={page}>
                    <PaginationEllipsis srOnlyLabel="Más páginas" />
                  </PaginationItem>
                )
              }
              return null
            })}
            <PaginationItem>
              <PaginationNext
                label="Siguiente"
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }}
                aria-disabled={currentPage === totalPages}
                className={
                  currentPage === totalPages ? "pointer-events-none opacity-50" : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {!isLoading ? (
        <p className="text-center text-sm text-muted-foreground">
          {total === 0
            ? "Sin resultados"
            : `Mostrando ${(currentPage - 1) * ITEMS_PER_PAGE + 1}–${Math.min(currentPage * ITEMS_PER_PAGE, total)} de ${total}`}
        </p>
      ) : null}

      <ChangePlanModal
        business={selectedBusiness}
        open={changePlanOpen}
        onOpenChange={setChangePlanOpen}
        onConfirm={confirmChangePlan}
      />
      <ExtendSubscriptionModal
        business={selectedBusiness}
        open={extendOpen}
        onOpenChange={setExtendOpen}
        onConfirm={confirmExtendSubscription}
      />
      <BlockModal
        business={selectedBusiness}
        status={selectedStatus}
        open={blockOpen}
        onOpenChange={setBlockOpen}
        onConfirm={confirmToggleBlock}
      />
      <ResetTokensModal
        business={selectedBusiness}
        open={resetTokensOpen}
        onOpenChange={setResetTokensOpen}
        onConfirm={confirmResetTokens}
      />
    </div>
  )
}
