"use client"

import { useState } from "react"

import type { PaymentProviderId } from "@/lib/requests/payment-providers"
import { cn } from "@/lib/utils"

interface ProviderBrandProps {
  providerId: PaymentProviderId
  name?: string | null
  image?: string | null
  className?: string
}

export function ProviderBrand({
  providerId,
  name,
  image,
  className,
}: ProviderBrandProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const displayName = getProviderDisplayName(providerId, name ?? undefined)
  const initials = getProviderInitials(displayName, providerId)
  const showImage = Boolean(image?.trim()) && !imageFailed

  if (showImage) {
    return (
      <div
        className={cn(
          "flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-white shadow-sm",
          className,
        )}
      >
        <img
          src={image!.trim()}
          alt={displayName}
          className="size-full object-contain p-1.5"
          onError={() => setImageFailed(true)}
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted text-sm font-semibold uppercase text-muted-foreground",
        className,
      )}
      aria-hidden
    >
      {initials}
    </div>
  )
}

export function getProviderDisplayName(
  providerId: PaymentProviderId,
  fallback?: string,
): string {
  if (fallback?.trim()) return fallback.trim()
  if (providerId === "mercado_pago") return "Mercado Pago"
  return providerId.replace(/_/g, " ")
}

function getProviderInitials(
  name: string,
  providerId: PaymentProviderId,
): string {
  const trimmed = name.trim()
  if (trimmed) {
    const parts = trimmed.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase()
    }
    return trimmed.slice(0, 2).toUpperCase()
  }
  return providerId.slice(0, 2).toUpperCase()
}
