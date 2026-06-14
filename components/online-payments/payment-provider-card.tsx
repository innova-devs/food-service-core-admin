"use client"

import Link from "next/link"
import { Settings2, Zap, ZapOff } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ProviderBrand,
  getProviderDisplayName,
} from "@/components/online-payments/provider-brand"
import type {
  AdminPaymentProvider,
  AvailablePaymentProvider,
} from "@/lib/requests/payment-providers"
import { cn } from "@/lib/utils"

interface PaymentProviderCardProps {
  available: AvailablePaymentProvider
  configured: AdminPaymentProvider | null
}

export function PaymentProviderCard({
  available,
  configured,
}: PaymentProviderCardProps) {
  const isConfigured = Boolean(configured)
  const isActive = Boolean(configured?.isActive)
  const displayName = getProviderDisplayName(available.id, available.name)
  const configureHref = `/online-payments/${available.id}/configure`

  return (
    <Card
      className={cn(
        "transition-shadow hover:shadow-md",
        isConfigured && !isActive && "border-amber-500/40",
      )}
    >
      <CardHeader className="gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <ProviderBrand
              providerId={available.id}
              name={available.name}
              image={available.image}
            />
            <div className="min-w-0">
              <CardTitle className="text-lg">{displayName}</CardTitle>
              {available.description ? (
                <CardDescription className="mt-1 line-clamp-2">
                  {available.description}
                </CardDescription>
              ) : null}
            </div>
          </div>
          <StatusBadge configured={isConfigured} active={isActive} />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {!isConfigured ? (
          <p className="rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
            Todavía no configuraste este método. Agregá tus credenciales para
            empezar a cobrar online.
          </p>
        ) : (
          <div className="grid gap-2 text-sm">
            <ConfigRow
              label="Access token"
              configured={configured?.accessTokenConfigured ?? false}
            />
            <ConfigRow
              label="Webhook secret"
              configured={configured?.webhookSecretConfigured ?? false}
            />
            <ConfigRow
              label="Modo"
              value={configured?.isSandbox ? "Sandbox (pruebas)" : "Producción"}
            />
            {configured?.publicKey ? (
              <ConfigRow
                label="Public key"
                value={maskKey(configured.publicKey)}
              />
            ) : null}
          </div>
        )}
      </CardContent>

      <CardFooter className="justify-end border-t bg-muted/20 pt-4">
        <Button asChild variant={isConfigured ? "outline" : "default"}>
          <Link href={configureHref}>
            <Settings2 className="size-4" />
            {isConfigured ? "Configurar" : "Configurar ahora"}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

function StatusBadge({
  configured,
  active,
}: {
  configured: boolean
  active: boolean
}) {
  if (active) {
    return (
      <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
        <Zap className="size-3" />
        Activo
      </Badge>
    )
  }

  if (configured) {
    return (
      <Badge
        variant="outline"
        className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
      >
        <ZapOff className="size-3" />
        Inactivo
      </Badge>
    )
  }

  return (
    <Badge variant="secondary" className="text-muted-foreground">
      Sin configurar
    </Badge>
  )
}

function ConfigRow({
  label,
  configured,
  value,
}: {
  label: string
  configured?: boolean
  value?: string
}) {
  if (value) {
    return (
      <div className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-xs">{value}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <Badge
        variant="outline"
        className={cn(
          configured
            ? "border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
            : "text-muted-foreground",
        )}
      >
        {configured ? "Configurado" : "Pendiente"}
      </Badge>
    </div>
  )
}

function maskKey(value: string): string {
  if (value.length <= 12) return value
  return `${value.slice(0, 8)}…${value.slice(-4)}`
}
