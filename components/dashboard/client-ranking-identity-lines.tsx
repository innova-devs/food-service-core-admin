import { cn } from "@/lib/utils"
import type { ClientRankingEntry } from "@/lib/requests/analytics"

const UNREGISTERED_LABEL = "Usuario no agendado"

function fallbackWhenNoName(entry: ClientRankingEntry): string {
  const phone = entry.phone?.trim()
  if (phone) return phone
  return entry.customerId.slice(0, 8)
}

export function ClientRankingIdentityLines({
  entry,
  primaryClassName,
}: {
  entry: ClientRankingEntry
  primaryClassName: string
}) {
  const name = entry.name?.trim()
  const phone = entry.phone?.trim()

  if (name) {
    return (
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className={cn("truncate", primaryClassName)}>{name}</div>
        {phone ? (
          <p className="text-xs text-muted-foreground">{phone}</p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <p className="text-xs text-muted-foreground">{UNREGISTERED_LABEL}</p>
      <div className={cn("truncate", primaryClassName)}>
        {fallbackWhenNoName(entry)}
      </div>
    </div>
  )
}
