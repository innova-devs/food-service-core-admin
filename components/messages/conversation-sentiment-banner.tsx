"use client"

import {
  AlertTriangle,
  Clock3,
  MessageSquareWarning,
  Sparkles,
  UserRound,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  getSentimentLabelEs,
  getSentimentVisualStyle,
  isNegativeConversationSentiment,
  type ConversationSentiment,
} from "@/lib/constants/conversationSentiment"

interface ConversationSentimentBannerProps {
  sentiment: ConversationSentiment
  summary?: string | null
}

function SentimentIcon({
  sentiment,
  className,
}: {
  sentiment: ConversationSentiment
  className?: string
}) {
  switch (sentiment) {
    case "FRUSTRATED":
      return <AlertTriangle className={className} aria-hidden />
    case "NEEDS_HUMAN":
      return <UserRound className={className} aria-hidden />
    case "ABANDONED":
      return <Clock3 className={className} aria-hidden />
    case "SPAM":
      return <MessageSquareWarning className={className} aria-hidden />
    default:
      return <Sparkles className={className} aria-hidden />
  }
}

export function ConversationSentimentBanner({
  sentiment,
  summary,
}: ConversationSentimentBannerProps) {
  const isNegative = isNegativeConversationSentiment(sentiment)
  const sentimentLabel = getSentimentLabelEs(sentiment)
  const sentimentStyle = getSentimentVisualStyle(sentiment)
  const trimmedSummary = summary?.trim() ?? ""

  return (
    <div
      role="note"
      aria-label={
        isNegative
          ? `Alerta de sentimiento: ${sentimentLabel}. ${trimmedSummary}`
          : `Sentimiento: ${sentimentLabel}. ${trimmedSummary}`
      }
      className={cn(
        "border-b px-4 py-3",
        sentimentStyle.banner,
        isNegative && "border-l-4 border-l-red-600",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full",
            isNegative
              ? "bg-red-600/15 text-red-700 dark:text-red-300"
              : "bg-background/60 text-foreground/80",
          )}
        >
          <SentimentIcon sentiment={sentiment} className="size-5" />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {isNegative ? (
              <Badge
                variant="destructive"
                className="gap-1 uppercase tracking-wide animate-pulse"
              >
                <AlertTriangle className="size-3" aria-hidden />
                Leer antes de responder
              </Badge>
            ) : null}
            <Badge
              variant="outline"
              className={cn("border-current/20 bg-background/50", sentimentStyle.badge)}
            >
              {sentimentLabel}
            </Badge>
          </div>

          {trimmedSummary ? (
            <div className="flex items-start gap-2 rounded-md bg-background/50 px-3 py-2">
              <Sparkles
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <p className="text-sm leading-relaxed">{trimmedSummary}</p>
            </div>
          ) : isNegative ? (
            <p className="text-sm leading-relaxed opacity-90">
              El cliente muestra señales de {sentimentLabel.toLowerCase()}. Revisá
              la conversación antes de intervenir.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
