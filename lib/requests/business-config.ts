import { api } from "@/lib/api"

export const ADMIN_BUSINESS_CONFIG_PATH = "/admin/config"

export type BotPersonalitySlug = "neutral" | "friendly" | "elegant"

export type BotPersonalitySampleResponse = {
  question: string
  response: string
}

export type BotPersonalityOption = {
  id: string
  slug: BotPersonalitySlug
  name: string
  description: string
  sample_responses: BotPersonalitySampleResponse[]
}

export type BusinessConfigBotPersonalityRef = {
  id: string
  slug: string
  name: string
} | null

export interface AdminBusinessConfig {
  bot_enabled: boolean
  allow_human_handoff: boolean
  human_handoff_auto_timeout_minutes: number | null
  send_idle_reminders: boolean
  idle_reminder_minutes: number
  idle_close_minutes: number
  send_order_reminders: boolean
  draft_order_reminder_minutes: number
  draft_order_expire_minutes: number
  reservations_enabled: boolean
  reservation_min_lead_minutes: number
  reservation_max_days_ahead: number
  reservation_default_duration_minutes: number
  reservation_require_confirmation: boolean
  reservation_allow_same_day: boolean
  orders_enabled: boolean
  checkout_enabled: boolean
  delivery_enabled: boolean
  takeaway_enabled: boolean
  pickup_instructions: string | null
  humanize_messages: boolean
  bot_personality_id: string
  bot_personality: BusinessConfigBotPersonalityRef
  operate_when_closed: boolean
  orders_when_closed: boolean
}

export type AdminBusinessConfigPatch = Partial<AdminBusinessConfig>

function normalizeAdminBusinessConfig(data: AdminBusinessConfig): AdminBusinessConfig {
  return {
    ...data,
    delivery_enabled: data.delivery_enabled ?? true,
    takeaway_enabled: data.takeaway_enabled ?? false,
    pickup_instructions: data.pickup_instructions ?? null,
    humanize_messages: data.humanize_messages ?? false,
    bot_personality_id: data.bot_personality_id ?? "",
    bot_personality: data.bot_personality ?? null,
    operate_when_closed: data.operate_when_closed ?? false,
    orders_when_closed: data.orders_when_closed ?? false,
  }
}

export async function fetchBotPersonalities(): Promise<BotPersonalityOption[]> {
  const { data } = await api.get<BotPersonalityOption[]>(
    `${ADMIN_BUSINESS_CONFIG_PATH}/bot-personalities`,
  )
  return data
}

export async function fetchAdminBusinessConfig(): Promise<AdminBusinessConfig> {
  const { data } = await api.get<AdminBusinessConfig>(ADMIN_BUSINESS_CONFIG_PATH)
  return normalizeAdminBusinessConfig(data)
}

export async function upsertAdminBusinessConfig(
  payload: AdminBusinessConfigPatch,
): Promise<AdminBusinessConfig> {
  const { data } = await api.post<AdminBusinessConfig>(
    ADMIN_BUSINESS_CONFIG_PATH,
    payload,
  )
  return normalizeAdminBusinessConfig(data)
}

export async function patchAdminBusinessConfig(
  payload: AdminBusinessConfigPatch,
): Promise<AdminBusinessConfig> {
  const { data } = await api.patch<AdminBusinessConfig>(
    ADMIN_BUSINESS_CONFIG_PATH,
    payload,
  )
  return normalizeAdminBusinessConfig(data)
}

export async function resetAdminBusinessConfig(): Promise<void> {
  await api.delete(ADMIN_BUSINESS_CONFIG_PATH)
}
