export const CONVERSATION_SENTIMENTS = [
  "FRUSTRATED",
  "NEEDS_HUMAN",
  "ABANDONED",
  "CONVERTED",
  "ENGAGED",
  "BROWSING",
  "SPAM",
] as const

export type ConversationSentiment = (typeof CONVERSATION_SENTIMENTS)[number]

export type NegativeConversationSentiment =
  | "FRUSTRATED"
  | "NEEDS_HUMAN"
  | "ABANDONED"

const SENTIMENT_SET = new Set<string>(CONVERSATION_SENTIMENTS)

export function isConversationSentiment(
  value: unknown,
): value is ConversationSentiment {
  return typeof value === "string" && SENTIMENT_SET.has(value)
}

export function isNegativeConversationSentiment(
  value: unknown,
): value is NegativeConversationSentiment {
  return (
    value === "FRUSTRATED" ||
    value === "NEEDS_HUMAN" ||
    value === "ABANDONED"
  )
}

export const CONVERSATION_SENTIMENT_FILTER_ALL = "all" as const
export const CONVERSATION_SENTIMENT_FILTER_ATTENTION = "attention" as const

export type ConversationSentimentFilter =
  | typeof CONVERSATION_SENTIMENT_FILTER_ALL
  | typeof CONVERSATION_SENTIMENT_FILTER_ATTENTION
  | ConversationSentiment

export const CONVERSATION_SENTIMENT_FILTER_OPTIONS: {
  value: ConversationSentimentFilter
  label: string
}[] = [
  { value: CONVERSATION_SENTIMENT_FILTER_ALL, label: "Todos" },
  {
    value: CONVERSATION_SENTIMENT_FILTER_ATTENTION,
    label: "Requiere atención",
  },
  ...CONVERSATION_SENTIMENTS.map((sentiment) => ({
    value: sentiment,
    label: getSentimentLabelEs(sentiment),
  })),
]

export function resolveApiSentimentFilter(
  filter: ConversationSentimentFilter,
): ConversationSentiment | undefined {
  if (
    filter === CONVERSATION_SENTIMENT_FILTER_ALL ||
    filter === CONVERSATION_SENTIMENT_FILTER_ATTENTION
  ) {
    return undefined
  }
  return filter
}

export function chatMatchesSentimentFilter(
  chat: { aiSentiment?: ConversationSentiment | null },
  filter: ConversationSentimentFilter,
): boolean {
  if (filter === CONVERSATION_SENTIMENT_FILTER_ALL) return true
  if (filter === CONVERSATION_SENTIMENT_FILTER_ATTENTION) {
    return isNegativeConversationSentiment(chat.aiSentiment)
  }
  return chat.aiSentiment === filter
}

export function getSentimentLabelEs(sentiment: ConversationSentiment): string {
  switch (sentiment) {
    case "FRUSTRATED":
      return "Frustrado"
    case "NEEDS_HUMAN":
      return "Necesita humano"
    case "ABANDONED":
      return "Abandonado"
    case "CONVERTED":
      return "Convertido"
    case "ENGAGED":
      return "Comprometido"
    case "BROWSING":
      return "Explorando"
    case "SPAM":
      return "Spam"
    default:
      return sentiment
  }
}

export type SentimentVisualStyle = {
  listItem: string
  badge: string
  banner: string
}

export function getSentimentVisualStyle(
  sentiment: ConversationSentiment,
): SentimentVisualStyle {
  switch (sentiment) {
    case "FRUSTRATED":
      return {
        listItem:
          "border-l-4 border-l-red-500 bg-red-50/80 hover:bg-red-50 dark:bg-red-950/20 dark:hover:bg-red-950/30",
        badge:
          "bg-red-500/15 text-red-700 dark:text-red-300",
        banner:
          "border-red-300/70 bg-red-50 text-red-950 dark:border-red-800 dark:bg-red-950/40 dark:text-red-100",
      }
    case "NEEDS_HUMAN":
      return {
        listItem:
          "border-l-4 border-l-orange-500 bg-orange-50/80 hover:bg-orange-50 dark:bg-orange-950/20 dark:hover:bg-orange-950/30",
        badge:
          "bg-orange-500/15 text-orange-700 dark:text-orange-300",
        banner:
          "border-orange-300/70 bg-orange-50 text-orange-950 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-100",
      }
    case "ABANDONED":
      return {
        listItem:
          "border-l-4 border-l-yellow-500 bg-yellow-50/80 hover:bg-yellow-50 dark:bg-yellow-950/20 dark:hover:bg-yellow-950/30",
        badge:
          "bg-yellow-500/20 text-yellow-800 dark:text-yellow-200",
        banner:
          "border-yellow-300/70 bg-yellow-50 text-yellow-950 dark:border-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-100",
      }
    case "CONVERTED":
      return {
        listItem:
          "border-l-4 border-l-green-500 bg-green-50/50 hover:bg-green-50/80 dark:bg-green-950/15 dark:hover:bg-green-950/25",
        badge:
          "bg-green-500/15 text-green-700 dark:text-green-300",
        banner:
          "border-green-300/70 bg-green-50 text-green-950 dark:border-green-800 dark:bg-green-950/40 dark:text-green-100",
      }
    case "ENGAGED":
      return {
        listItem:
          "border-l-4 border-l-blue-500 bg-blue-50/50 hover:bg-blue-50/80 dark:bg-blue-950/15 dark:hover:bg-blue-950/25",
        badge:
          "bg-blue-500/15 text-blue-700 dark:text-blue-300",
        banner:
          "border-blue-300/70 bg-blue-50 text-blue-950 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-100",
      }
    case "BROWSING":
      return {
        listItem:
          "border-l-4 border-l-muted-foreground/30 bg-muted/20 hover:bg-muted/40",
        badge:
          "bg-muted text-muted-foreground",
        banner:
          "border-muted-foreground/30 bg-muted/40 text-muted-foreground",
      }
    case "SPAM":
      return {
        listItem:
          "border-l-4 border-l-neutral-700 bg-neutral-100/80 opacity-75 hover:bg-neutral-100 dark:border-neutral-500 dark:bg-neutral-900/40",
        badge:
          "bg-neutral-800/15 text-neutral-700 line-through dark:text-neutral-300",
        banner:
          "border-neutral-400/70 bg-neutral-100 text-neutral-800 dark:border-neutral-600 dark:bg-neutral-900/50 dark:text-neutral-200",
      }
    default:
      return {
        listItem: "",
        badge: "",
        banner: "",
      }
  }
}
