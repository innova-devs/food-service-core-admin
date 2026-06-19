export const BOT_USER_MESSAGE_RE =
  /^🤖\n\n\*([^*]+)\* ([^\n]+)\n\n([\s\S]*)$/

export type ParsedBotUserMessage = {
  title: string
  emoji: string
  body: string
}

export type WhatsAppBoldSegment =
  | { type: "text"; value: string }
  | { type: "bold"; value: string }

export function parseBotUserMessage(
  text: string,
): ParsedBotUserMessage | null {
  const match = text.match(BOT_USER_MESSAGE_RE)
  if (!match) return null

  return {
    title: match[1],
    emoji: match[2],
    body: match[3],
  }
}

/** Convierte solo *texto* (un asterisco a cada lado) en segmentos texto/negrita. */
export function splitWhatsAppBoldSegments(text: string): WhatsAppBoldSegment[] {
  const segments: WhatsAppBoldSegment[] = []
  const re = /\*([^*]+)\*/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, match.index) })
    }
    segments.push({ type: "bold", value: match[1] })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) })
  }

  return segments
}
