import { api } from "@/lib/api"

export const ADMIN_PAYMENT_PROVIDERS_PATH = "/admin/payment-providers"

export type PaymentProviderId = "mercado_pago" | (string & {})

export interface AvailablePaymentProvider {
  id: PaymentProviderId
  name: string
  image: string | null
  description: string | null
}

export interface AdminPaymentProvider {
  id: string
  provider: PaymentProviderId
  publicKey: string | null
  accessTokenConfigured: boolean
  webhookSecretConfigured: boolean
  isSandbox: boolean
  isActive: boolean
  createdAt: string | null
  updatedAt: string | null
}

export interface AdminPaymentProvidersListResponse {
  items: AdminPaymentProvider[]
  availableProviders: AvailablePaymentProvider[]
}

export interface CreateAdminPaymentProviderPayload {
  provider: PaymentProviderId
  accessToken: string
  publicKey?: string | null
  webhookSecret?: string | null
  isSandbox?: boolean
  isActive?: boolean
}

export interface UpdateAdminPaymentProviderPayload {
  accessToken?: string
  publicKey?: string | null
  webhookSecret?: string | null
  isSandbox?: boolean
  isActive?: boolean
}

interface PaymentProviderRaw {
  id?: string
  provider?: string
  public_key?: string | null
  publicKey?: string | null
  access_token_configured?: boolean
  accessTokenConfigured?: boolean
  webhook_secret_configured?: boolean
  webhookSecretConfigured?: boolean
  is_sandbox?: boolean
  isSandbox?: boolean
  is_active?: boolean
  isActive?: boolean
  created_at?: string | null
  createdAt?: string | null
  updated_at?: string | null
  updatedAt?: string | null
}

interface AvailableProviderRaw {
  id?: string
  name?: string
  image?: string | null
  description?: string | null
}

interface ListResponseRaw {
  items?: PaymentProviderRaw[]
  available_providers?: AvailableProviderRaw[]
  availableProviders?: AvailableProviderRaw[]
}

function mapPaymentProvider(raw: PaymentProviderRaw): AdminPaymentProvider {
  return {
    id: String(raw.id ?? ""),
    provider: String(raw.provider ?? "") as PaymentProviderId,
    publicKey:
      typeof (raw.publicKey ?? raw.public_key) === "string"
        ? String(raw.publicKey ?? raw.public_key)
        : null,
    accessTokenConfigured: Boolean(
      raw.accessTokenConfigured ?? raw.access_token_configured,
    ),
    webhookSecretConfigured: Boolean(
      raw.webhookSecretConfigured ?? raw.webhook_secret_configured,
    ),
    isSandbox: Boolean(raw.isSandbox ?? raw.is_sandbox),
    isActive: Boolean(raw.isActive ?? raw.is_active),
    createdAt:
      typeof (raw.createdAt ?? raw.created_at) === "string"
        ? String(raw.createdAt ?? raw.created_at)
        : null,
    updatedAt:
      typeof (raw.updatedAt ?? raw.updated_at) === "string"
        ? String(raw.updatedAt ?? raw.updated_at)
        : null,
  }
}

function mapAvailableProvider(raw: AvailableProviderRaw): AvailablePaymentProvider {
  const imageRaw = raw.image
  return {
    id: String(raw.id ?? "") as PaymentProviderId,
    name: String(raw.name ?? raw.id ?? "Proveedor"),
    image:
      typeof imageRaw === "string" && imageRaw.trim() ? imageRaw.trim() : null,
    description:
      typeof raw.description === "string" && raw.description.trim()
        ? raw.description
        : null,
  }
}

function mapListResponse(data: ListResponseRaw): AdminPaymentProvidersListResponse {
  const availableRaw = data.availableProviders ?? data.available_providers ?? []
  return {
    items: Array.isArray(data.items) ? data.items.map(mapPaymentProvider) : [],
    availableProviders: Array.isArray(availableRaw)
      ? availableRaw.map(mapAvailableProvider)
      : [],
  }
}

export async function fetchAdminPaymentProviders(): Promise<AdminPaymentProvidersListResponse> {
  const { data } = await api.get<ListResponseRaw>(ADMIN_PAYMENT_PROVIDERS_PATH)
  return mapListResponse(data)
}

export async function fetchAdminPaymentProviderById(
  id: string,
): Promise<AdminPaymentProvider> {
  const { data } = await api.get<PaymentProviderRaw>(
    `${ADMIN_PAYMENT_PROVIDERS_PATH}/${id}`,
  )
  return mapPaymentProvider(data)
}

export async function createAdminPaymentProvider(
  payload: CreateAdminPaymentProviderPayload,
): Promise<AdminPaymentProvider> {
  const { data } = await api.post<PaymentProviderRaw>(
    ADMIN_PAYMENT_PROVIDERS_PATH,
    payload,
  )
  return mapPaymentProvider(data)
}

export async function updateAdminPaymentProvider(
  id: string,
  payload: UpdateAdminPaymentProviderPayload,
): Promise<AdminPaymentProvider> {
  const { data } = await api.patch<PaymentProviderRaw>(
    `${ADMIN_PAYMENT_PROVIDERS_PATH}/${id}`,
    payload,
  )
  return mapPaymentProvider(data)
}

export async function deleteAdminPaymentProvider(id: string): Promise<void> {
  await api.delete(`${ADMIN_PAYMENT_PROVIDERS_PATH}/${id}`)
}
