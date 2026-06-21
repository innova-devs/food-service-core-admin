import { api } from "@/lib/api"
import {
  isConversationSentiment,
  type ConversationSentiment,
} from "@/lib/constants/conversationSentiment"

export const ADMIN_WHATSAPP_MESSAGES_PATH = "/admin/whatsapp/messages"
export const ADMIN_WHATSAPP_CONVERSATIONS_PATH = "/admin/whatsapp/conversations"

export interface AdminWhatsappCustomer {
  id: string
  name: string | null
  phoneNumber: string
}

export interface AdminWhatsappConversation {
  id: string
  botEnabled?: boolean
  aiSentiment?: ConversationSentiment | null
  aiSentimentUpdatedAt?: string | null
  customer: AdminWhatsappCustomer
}

export type AdminWhatsappConversationStatus = "open" | "closed"

export interface AdminWhatsappConversationListItem {
  id: string
  status: AdminWhatsappConversationStatus
  startedAt: string
  lastMessageAt: string
  aiSentiment: ConversationSentiment | null
  aiSentimentUpdatedAt: string | null
  customer: AdminWhatsappCustomer
  botEnabled: boolean
  currentIntent: string | null
}

export interface FetchAdminWhatsappConversationsParams {
  page?: number
  pageSize?: number
  sentiment?: ConversationSentiment
  customerPhone?: string
}

export interface AdminWhatsappConversationsListResponse {
  items: AdminWhatsappConversationListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface AdminWhatsappMessage {
  id: string
  sender: string
  message: string
  isAiGenerated: boolean
  createdAt: string
  conversation: AdminWhatsappConversation
}

export interface FetchAdminWhatsappMessagesParams {
  page?: number
  pageSize?: number
  conversationId?: string
  customerPhone?: string
}

interface AdminWhatsappMessageRaw {
  id?: string
  message_id?: string
  sender?: string | null
  message?: string | null
  text?: string | null
  is_ai_generated?: boolean | null
  isAiGenerated?: boolean | null
  created_at?: string | null
  createdAt?: string | null
  conversation?: {
    id?: string | null
    bot_enabled?: boolean | null
    botEnabled?: boolean | null
    ai_sentiment?: string | null
    aiSentiment?: string | null
    ai_sentiment_updated_at?: string | null
    aiSentimentUpdatedAt?: string | null
    customer?: {
      id?: string | null
      name?: string | null
      phone_number?: string | null
      phoneNumber?: string | null
    } | null
  } | null
}

interface AdminWhatsappMessagesListResponseRaw {
  items?: AdminWhatsappMessageRaw[]
  total?: number
  page?: number
  pageSize?: number
  totalPages?: number
}

interface AdminWhatsappConversationListItemRaw {
  id?: string | null
  status?: string | null
  started_at?: string | null
  startedAt?: string | null
  last_message_at?: string | null
  lastMessageAt?: string | null
  ai_sentiment?: string | null
  aiSentiment?: string | null
  ai_sentiment_updated_at?: string | null
  aiSentimentUpdatedAt?: string | null
  bot_enabled?: boolean | null
  botEnabled?: boolean | null
  current_intent?: string | null
  currentIntent?: string | null
  customer?: {
    id?: string | null
    name?: string | null
    phone_number?: string | null
    phoneNumber?: string | null
  } | null
}

interface AdminWhatsappConversationsListResponseRaw {
  items?: AdminWhatsappConversationListItemRaw[]
  total?: number
  page?: number
  pageSize?: number
  totalPages?: number
}

export interface AdminWhatsappMessagesListResponse {
  items: AdminWhatsappMessage[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

interface AdminWhatsappConversationBotStatusRaw {
  enabled?: boolean
  botEnabled?: boolean
}

interface AdminWhatsappSendMessageRaw {
  id?: string
  message_id?: string
}

function toNonEmpty(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function parseConversationSentiment(
  value: unknown,
): ConversationSentiment | null {
  return isConversationSentiment(value) ? value : null
}

function mapRawConversationCustomer(
  raw:
    | AdminWhatsappMessageRaw["conversation"]
    | AdminWhatsappConversationListItemRaw["customer"]
    | null
    | undefined,
): AdminWhatsappCustomer {
  if (!raw || typeof raw !== "object" || !("customer" in raw)) {
    const customerRaw = raw as AdminWhatsappConversationListItemRaw["customer"]
    return {
      id: toNonEmpty(customerRaw?.id),
      name: customerRaw?.name ?? null,
      phoneNumber: toNonEmpty(
        customerRaw?.phoneNumber ?? customerRaw?.phone_number,
      ),
    }
  }

  return {
    id: toNonEmpty(raw.customer?.id),
    name: raw.customer?.name ?? null,
    phoneNumber: toNonEmpty(
      raw.customer?.phoneNumber ?? raw.customer?.phone_number,
    ),
  }
}

function mapRawMessage(raw: AdminWhatsappMessageRaw): AdminWhatsappMessage {
  const rawBotEnabled =
    raw.conversation?.botEnabled ?? raw.conversation?.bot_enabled
  const rawSentiment =
    raw.conversation?.aiSentiment ?? raw.conversation?.ai_sentiment
  const rawSentimentUpdatedAt =
    raw.conversation?.aiSentimentUpdatedAt ??
    raw.conversation?.ai_sentiment_updated_at
  return {
    id: toNonEmpty(raw.id ?? raw.message_id),
    sender: toNonEmpty(raw.sender),
    message: toNonEmpty(raw.message ?? raw.text),
    isAiGenerated: Boolean(raw.isAiGenerated ?? raw.is_ai_generated),
    createdAt: toNonEmpty(raw.createdAt ?? raw.created_at),
    conversation: {
      id: toNonEmpty(raw.conversation?.id),
      botEnabled:
        typeof rawBotEnabled === "boolean" ? rawBotEnabled : undefined,
      aiSentiment: parseConversationSentiment(rawSentiment),
      aiSentimentUpdatedAt:
        typeof rawSentimentUpdatedAt === "string" && rawSentimentUpdatedAt.trim()
          ? rawSentimentUpdatedAt
          : null,
      customer: mapRawConversationCustomer(raw.conversation),
    },
  }
}

function mapRawConversationListItem(
  raw: AdminWhatsappConversationListItemRaw,
): AdminWhatsappConversationListItem {
  const rawSentiment = raw.aiSentiment ?? raw.ai_sentiment
  const rawSentimentUpdatedAt =
    raw.aiSentimentUpdatedAt ?? raw.ai_sentiment_updated_at
  const status = raw.status === "closed" ? "closed" : "open"

  return {
    id: toNonEmpty(raw.id),
    status,
    startedAt: toNonEmpty(raw.startedAt ?? raw.started_at),
    lastMessageAt: toNonEmpty(raw.lastMessageAt ?? raw.last_message_at),
    aiSentiment: parseConversationSentiment(rawSentiment),
    aiSentimentUpdatedAt:
      typeof rawSentimentUpdatedAt === "string" && rawSentimentUpdatedAt.trim()
        ? rawSentimentUpdatedAt
        : null,
    customer: mapRawConversationCustomer(raw.customer),
    botEnabled: Boolean(raw.botEnabled ?? raw.bot_enabled),
    currentIntent:
      typeof (raw.currentIntent ?? raw.current_intent) === "string"
        ? String(raw.currentIntent ?? raw.current_intent)
        : null,
  }
}

export async function fetchAdminWhatsappConversations(
  params: FetchAdminWhatsappConversationsParams = {},
): Promise<AdminWhatsappConversationsListResponse> {
  const page = params.page ?? 1
  const pageSize = Math.min(params.pageSize ?? 20, 100)

  const { data } = await api.get<AdminWhatsappConversationsListResponseRaw>(
    ADMIN_WHATSAPP_CONVERSATIONS_PATH,
    {
      params: {
        page,
        pageSize,
        ...(params.sentiment ? { sentiment: params.sentiment } : {}),
        ...(params.customerPhone?.trim()
          ? { customerPhone: params.customerPhone.trim() }
          : {}),
      },
    },
  )

  return {
    items: Array.isArray(data.items)
      ? data.items.map(mapRawConversationListItem)
      : [],
    total: Number.isFinite(data.total) ? Number(data.total) : 0,
    page: Number.isFinite(data.page) ? Number(data.page) : page,
    pageSize: Number.isFinite(data.pageSize) ? Number(data.pageSize) : pageSize,
    totalPages: Number.isFinite(data.totalPages) ? Number(data.totalPages) : 0,
  }
}

export async function fetchAdminWhatsappMessages(
  params: FetchAdminWhatsappMessagesParams = {},
): Promise<AdminWhatsappMessagesListResponse> {
  const page = params.page ?? 1
  const pageSize = Math.min(params.pageSize ?? 20, 100)

  const { data } = await api.get<AdminWhatsappMessagesListResponseRaw>(
    ADMIN_WHATSAPP_MESSAGES_PATH,
    {
      params: {
        page,
        pageSize,
        ...(params.conversationId?.trim()
          ? { conversationId: params.conversationId.trim() }
          : {}),
        ...(params.customerPhone?.trim()
          ? { customerPhone: params.customerPhone.trim() }
          : {}),
      },
    },
  )

  return {
    items: Array.isArray(data.items) ? data.items.map(mapRawMessage) : [],
    total: Number.isFinite(data.total) ? Number(data.total) : 0,
    page: Number.isFinite(data.page) ? Number(data.page) : page,
    pageSize: Number.isFinite(data.pageSize) ? Number(data.pageSize) : pageSize,
    totalPages: Number.isFinite(data.totalPages) ? Number(data.totalPages) : 0,
  }
}

function adminWhatsappConversationBotPath(conversationId: string): string {
  return `/admin/whatsapp/conversations/${conversationId}/bot`
}

export async function fetchAdminWhatsappConversationBotStatus(
  conversationId: string,
): Promise<boolean> {
  const { data } = await api.get<AdminWhatsappConversationBotStatusRaw>(
    adminWhatsappConversationBotPath(conversationId),
  )
  return Boolean(data.botEnabled ?? data.enabled)
}

export async function patchAdminWhatsappConversationBotStatus(
  conversationId: string,
  enabled: boolean,
): Promise<boolean> {
  const { data } = await api.patch<AdminWhatsappConversationBotStatusRaw>(
    adminWhatsappConversationBotPath(conversationId),
    { enabled },
  )
  return Boolean(data.botEnabled ?? data.enabled ?? enabled)
}

function adminWhatsappConversationMessagesPath(conversationId: string): string {
  return `/admin/whatsapp/conversations/${conversationId}/messages`
}

export type SendAdminWhatsappMessageOptions = {
  /** Solo true en el aviso automático al reactivar el bot; omitir en envíos manuales del operador. */
  skipHumanTakeover?: boolean
}

export async function sendAdminWhatsappMessage(
  conversationId: string,
  message: string,
  options?: SendAdminWhatsappMessageOptions,
): Promise<{ id: string | null }> {
  const body: { message: string; skipHumanTakeover?: boolean } = { message }
  if (options?.skipHumanTakeover === true) {
    body.skipHumanTakeover = true
  }
  const { data } = await api.post<AdminWhatsappSendMessageRaw>(
    adminWhatsappConversationMessagesPath(conversationId),
    body,
  )
  const id = data.id ?? data.message_id ?? null
  return { id: typeof id === "string" && id.trim() ? id : null }
}
