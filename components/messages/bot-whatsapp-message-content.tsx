import {
  parseBotUserMessage,
  splitWhatsAppBoldSegments,
} from "@/lib/whatsapp-bot-message"
import { cn } from "@/lib/utils"

function WhatsAppBoldText({ text }: { text: string }) {
  const segments = splitWhatsAppBoldSegments(text)

  if (segments.length === 0) {
    return text
  }

  return (
    <>
      {segments.map((segment, index) =>
        segment.type === "bold" ? (
          <strong key={index}>{segment.value}</strong>
        ) : (
          <span key={index}>{segment.value}</span>
        ),
      )}
    </>
  )
}

interface BotWhatsAppMessageContentProps {
  content: string
  className?: string
}

export function BotWhatsAppMessageContent({
  content,
  className,
}: BotWhatsAppMessageContentProps) {
  const parsed = parseBotUserMessage(content)

  if (!parsed) {
    return (
      <p className={cn("whitespace-pre-wrap text-sm leading-relaxed", className)}>
        {content}
      </p>
    )
  }

  return (
    <div className={cn("text-sm leading-relaxed", className)}>
      <p className="mb-1" aria-hidden="true">
        🤖
      </p>
      <p className="font-semibold">
        {parsed.title} {parsed.emoji}
      </p>
      <p className="mt-1 whitespace-pre-wrap">
        <WhatsAppBoldText text={parsed.body} />
      </p>
    </div>
  )
}
