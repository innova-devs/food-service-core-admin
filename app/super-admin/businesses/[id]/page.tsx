"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { isAxiosError } from "axios"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import { ArrowLeft, Building2, CreditCard, Cpu, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { UsageProgress } from "@/components/super-admin/usage-progress"
import { BusinessStatusBadge } from "@/components/super-admin/business-status-badge"
import { ChangePlanModal } from "@/components/super-admin/change-plan-modal"
import { ExtendSubscriptionModal } from "@/components/super-admin/extend-subscription-modal"
import { BlockModal } from "@/components/super-admin/block-modal"
import { ResetTokensModal } from "@/components/super-admin/reset-tokens-modal"
import type { BusinessWithSubscription, Subscription } from "@/components/super-admin/types"
import { getBusinessStatus, formatTokens } from "@/components/super-admin/types"
import { fetchSuperAdminBusinessById } from "@/lib/requests/super-admin-businesses"

function etiquetaEstadoSuscripcion(status: string): string {
  const s = status.toLowerCase()
  if (s === "active") return "Activa"
  if (s === "canceled" || s === "cancelled") return "Cancelada"
  if (s === "past_due") return "Pago vencido"
  return status
}

interface BusinessDetailPageProps {
  params: Promise<{ id: string }>
}

export default function BusinessDetailPage({ params }: BusinessDetailPageProps) {
  const { id } = use(params)
  const router = useRouter()

  const [business, setBusiness] = useState<BusinessWithSubscription | null>(null)
  const [loadState, setLoadState] = useState<"loading" | "ready" | "notfound" | "error">(
    "loading",
  )

  const [changePlanOpen, setChangePlanOpen] = useState(false)
  const [extendOpen, setExtendOpen] = useState(false)
  const [blockOpen, setBlockOpen] = useState(false)
  const [resetTokensOpen, setResetTokensOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoadState("loading")
    setBusiness(null)

    void (async () => {
      try {
        const data = await fetchSuperAdminBusinessById(id)
        if (!cancelled) {
          setBusiness(data)
          setLoadState("ready")
        }
      } catch (e) {
        if (cancelled) return
        if (isAxiosError(e) && e.response?.status === 404) {
          setLoadState("notfound")
          return
        }
        const msg = isAxiosError(e)
          ? (e.response?.data as { message?: string; error?: string })?.message ??
            (e.response?.data as { message?: string; error?: string })?.error ??
            e.message
          : "No se pudo cargar el negocio."
        toast.error(typeof msg === "string" && msg ? msg : "No se pudo cargar el negocio.")
        setLoadState("error")
      }
    })()

    return () => {
      cancelled = true
    }
  }, [id])

  if (loadState === "loading") {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-32" />
      </div>
    )
  }

  if (loadState === "notfound" || !business) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-lg font-medium">Negocio no encontrado</h2>
        <p className="text-muted-foreground">
          No existe un negocio con ese identificador.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/super-admin/businesses")}
        >
          <ArrowLeft className="size-4" />
          Volver a negocios
        </Button>
      </div>
    )
  }

  if (loadState === "error") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-muted-foreground">No se pudo cargar el negocio.</p>
        <Button variant="outline" onClick={() => router.push("/super-admin/businesses")}>
          <ArrowLeft className="size-4" />
          Volver a negocios
        </Button>
      </div>
    )
  }

  const status = getBusinessStatus(business, business.subscription)
  const usagePercent = Math.round(
    (business.ai_monthly_tokens_used / business.ai_monthly_token_limit) * 100,
  )

  const confirmChangePlan = (plan: Subscription["plan_name"]) => {
    const tokenLimits: Record<Subscription["plan_name"], number> = {
      Basic: 50000,
      Pro: 100000,
      Business: 250000,
    }

    setBusiness((prev) =>
      prev
        ? {
            ...prev,
            ai_monthly_token_limit: tokenLimits[plan],
            subscription: { ...prev.subscription, plan_name: plan },
          }
        : null,
    )
    toast.success(`Plan cambiado a ${plan}.`)
  }

  const confirmExtendSubscription = (newEndDate: Date) => {
    setBusiness((prev) =>
      prev
        ? {
            ...prev,
            subscription: {
              ...prev.subscription,
              current_period_end: newEndDate.toISOString(),
            },
          }
        : null,
    )
    toast.success("Suscripción extendida")
  }

  const confirmToggleBlock = () => {
    const wasBlocked = business.ai_blocked
    setBusiness((prev) =>
      prev ? { ...prev, ai_blocked: !prev.ai_blocked } : null,
    )
    toast.success(wasBlocked ? "Negocio desbloqueado" : "Negocio bloqueado")
  }

  const confirmResetTokens = () => {
    setBusiness((prev) =>
      prev ? { ...prev, ai_monthly_tokens_used: 0 } : null,
    )
    toast.success("Tokens reiniciados")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/super-admin/businesses")}
        >
          <ArrowLeft className="size-4" />
          <span className="sr-only">Volver a negocios</span>
        </Button>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {business.name}
            </h1>
            <BusinessStatusBadge status={status} />
          </div>
          <p className="text-sm text-muted-foreground">
            ID: {business.id}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <Building2 className="size-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">Negocio</CardTitle>
              <CardDescription>Información básica</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Nombre</span>
              <span className="text-sm font-medium">{business.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">ID</span>
              <span className="text-sm font-mono">{business.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Alta</span>
              <span className="text-sm">
                {format(new Date(business.created_at), "d MMM yyyy", {
                  locale: es,
                })}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <CreditCard className="size-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">Suscripción</CardTitle>
              <CardDescription>Plan y facturación</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Plan</span>
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
                {business.subscription.plan_name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Estado (facturación)</span>
              <span className="text-xs text-muted-foreground">
                {etiquetaEstadoSuscripcion(business.subscription.status)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Inicio período</span>
              <span className="text-sm">
                {format(
                  new Date(business.subscription.current_period_start),
                  "d MMM yyyy",
                  { locale: es },
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Fin período</span>
              <span className="text-sm">
                {format(
                  new Date(business.subscription.current_period_end),
                  "d MMM yyyy",
                  { locale: es },
                )}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <Cpu className="size-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">Uso de IA</CardTitle>
              <CardDescription>Tokens en el período actual</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Tokens</span>
              <span className="text-sm font-medium">
                {formatTokens(business.ai_monthly_tokens_used)} /{" "}
                {formatTokens(business.ai_monthly_token_limit)}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Uso</span>
                <span className="font-medium">{usagePercent}%</span>
              </div>
              <UsageProgress value={usagePercent} />
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Restantes</span>
              <span className="text-sm">
                {formatTokens(
                  business.ai_monthly_token_limit - business.ai_monthly_tokens_used,
                )}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
            <Settings className="size-5 text-muted-foreground" />
          </div>
          <div>
            <CardTitle className="text-base">Acciones</CardTitle>
            <CardDescription>
              Pendiente de integración con API de administración
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => setChangePlanOpen(true)}>
              <CreditCard className="size-4" />
              Cambiar plan
            </Button>
            <Button variant="outline" onClick={() => setExtendOpen(true)}>
              Extender suscripción
            </Button>
            <Button
              variant={status === "Blocked" ? "default" : "outline"}
              onClick={() => setBlockOpen(true)}
            >
              {status === "Blocked" ? "Desbloquear" : "Bloquear"}
            </Button>
            <Button variant="outline" onClick={() => setResetTokensOpen(true)}>
              Reiniciar tokens
            </Button>
          </div>
        </CardContent>
      </Card>

      <ChangePlanModal
        business={business}
        open={changePlanOpen}
        onOpenChange={setChangePlanOpen}
        onConfirm={confirmChangePlan}
      />
      <ExtendSubscriptionModal
        business={business}
        open={extendOpen}
        onOpenChange={setExtendOpen}
        onConfirm={confirmExtendSubscription}
      />
      <BlockModal
        business={business}
        status={status}
        open={blockOpen}
        onOpenChange={setBlockOpen}
        onConfirm={confirmToggleBlock}
      />
      <ResetTokensModal
        business={business}
        open={resetTokensOpen}
        onOpenChange={setResetTokensOpen}
        onConfirm={confirmResetTokens}
      />
    </div>
  )
}
