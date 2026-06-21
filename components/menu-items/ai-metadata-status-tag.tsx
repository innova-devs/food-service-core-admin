"use client"

import { Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface AiMetadataStatusTagProps {
  status: "loading" | "present" | "missing"
  onClick: () => void
  disabled?: boolean
}

export function AiMetadataStatusTag({
  status,
  onClick,
  disabled = false,
}: AiMetadataStatusTagProps) {
  if (status === "loading") {
    return <Skeleton className="h-7 w-64 rounded-md" />
  }

  const isPresent = status === "present"

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <Badge
        variant="outline"
        className={cn(
          "cursor-pointer gap-2 px-2.5 py-1 text-xs font-medium transition-colors [&>svg]:size-6",
          isPresent
            ? "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300 dark:hover:bg-violet-900"
            : "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300 dark:hover:bg-amber-900",
        )}
      >
        <Sparkles className="size-6 shrink-0" />
        {isPresent
          ? "Datos complementarios generados por IA"
          : "Sin datos complementarios de IA"}
      </Badge>
    </button>
  )
}
