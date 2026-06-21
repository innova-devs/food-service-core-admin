"use client"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { AlertCircle, Bot, Smile } from "lucide-react"
import {
  getSentimentLabelEs,
  getSentimentVisualStyle,
  type ConversationSentiment,
} from "@/lib/constants/conversationSentiment"

export interface ChatItemData {
  id: string
  customerName: string
  customerPhone?: string
  avatar?: string
  lastMessage: string
  timestamp: string
  unreadCount: number
  isOnline?: boolean
  botEnabled?: boolean
  /** Solicitud de soporte humana pendiente (socket `whatsapp.support_requested`). */
  needsSupport?: boolean
  aiSentiment?: ConversationSentiment | null
  aiSentimentSummary?: string | null
  aiSentimentUpdatedAt?: string | null
}

interface ChatItemProps {
  chat: ChatItemData
  isSelected: boolean
  onClick: () => void
}

export function ChatItem({ chat, isSelected, onClick }: ChatItemProps) {
  const sentiment = chat.aiSentiment ?? null
  const sentimentStyle = sentiment ? getSentimentVisualStyle(sentiment) : null
  const sentimentLabel = sentiment ? getSentimentLabelEs(sentiment) : null
  const sentimentTooltip =
    chat.aiSentimentSummary?.trim() ||
    (sentimentLabel ? `Sentimiento: ${sentimentLabel}` : null)

  const itemButton = (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full min-w-0 items-start gap-3 overflow-hidden rounded-lg p-3 text-left transition-colors hover:bg-accent",
        sentimentStyle?.listItem,
        isSelected && !sentimentStyle && "bg-accent",
        isSelected && sentimentStyle && "ring-1 ring-inset ring-foreground/10",
      )}
    >
      <div className="relative">
        <Avatar className="size-10">
          {chat.avatar ? (
            <AvatarImage src={chat.avatar} alt={chat.customerName} />
          ) : null}
          <AvatarFallback className="bg-primary/10 text-primary">
            {chat.customerName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {chat.isOnline && (
          <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-background bg-green-500" />
        )}
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                "truncate font-medium",
                sentiment === "SPAM" && "line-through opacity-70",
              )}
            >
              {chat.customerName}
            </span>
            {sentiment && sentimentStyle ? (
              <span
                className={cn(
                  "inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  sentimentStyle.badge,
                )}
              >
                {sentimentLabel}
              </span>
            ) : null}
            {chat.needsSupport ? (
              <span
                className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-orange-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-700"
                title="Cliente necesita atención humana"
              >
                <AlertCircle className="size-3 shrink-0 animate-pulse" aria-hidden />
                Soporte
              </span>
            ) : null}
            {chat.botEnabled ? (
              <Bot
                className={cn("size-7 shrink-0 text-green-600")}
                aria-label="Chat con bot activo"
              />
            ) : (
              <Smile
                className={cn("size-7 shrink-0 text-muted-foreground")}
                aria-label="Chat en modo humano"
              />
            )}
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">
            {chat.timestamp}
          </span>
        </div>
        <div className="flex min-w-0 items-center justify-between gap-2">
          <p
            className={cn(
              "min-w-0 flex-1 truncate text-sm text-muted-foreground",
              sentiment === "SPAM" && "line-through opacity-70",
            )}
          >
            {chat.lastMessage}
          </p>
          {chat.unreadCount > 0 && (
            <Badge variant="default" className="size-5 shrink-0 justify-center rounded-full p-0 text-xs">
              {chat.unreadCount > 9 ? "9+" : chat.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </button>
  )

  if (!sentimentTooltip) {
    return itemButton
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{itemButton}</TooltipTrigger>
      <TooltipContent side="right" className="max-w-xs text-left">
        {sentimentTooltip}
      </TooltipContent>
    </Tooltip>
  )
}
