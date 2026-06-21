import { api } from "@/lib/api"
import { isAxiosError } from "axios"

export interface AiDraft {
  display_name: string
  short_description: string
  search_keywords: string[]
  synonyms: string[]
  category_suggestion: string
  product_tags: string[]
}

export interface AiMetadataRecord {
  id: string
  menu_item_id: string
  display_name: string
  short_description: string
  search_keywords: string[]
  synonyms: string[]
  category_suggestion: string
  product_tags: string[]
  model_version: string
  generated_at: string
  extra: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface SaveAiMetadataInput {
  display_name?: string
  short_description?: string
  search_keywords?: string[]
  synonyms?: string[]
  category_suggestion?: string
  product_tags?: string[]
  modelVersion?: string
}

export interface AiMetadataDraft {
  display_name: string
  short_description: string
  search_keywords: string[]
  synonyms: string[]
  product_tags: string[]
}

export function aiMetadataToDraft(record: AiMetadataRecord): AiMetadataDraft {
  return {
    display_name: record.display_name ?? "",
    short_description: record.short_description ?? "",
    search_keywords: record.search_keywords ?? [],
    synonyms: record.synonyms ?? [],
    product_tags: record.product_tags ?? [],
  }
}

export async function generateAiEnrichment(menuItemId: string): Promise<AiDraft> {
  const { data } = await api.post<{ draft: AiDraft }>(
    `/admin/menu-items/${menuItemId}/generate-enrichment`,
  )
  return data.draft
}

export async function saveAiMetadata(
  menuItemId: string,
  input: SaveAiMetadataInput,
): Promise<AiMetadataRecord> {
  const { data } = await api.put<AiMetadataRecord>(
    `/admin/menu-items/${menuItemId}/ai-metadata`,
    input,
  )
  return data
}

export async function fetchAiMetadata(menuItemId: string): Promise<AiMetadataRecord> {
  const { data } = await api.get<AiMetadataRecord>(
    `/admin/menu-items/${menuItemId}/ai-metadata`,
  )
  return data
}

export async function fetchAiMetadataOrNull(
  menuItemId: string,
): Promise<AiMetadataRecord | null> {
  try {
    return await fetchAiMetadata(menuItemId)
  } catch (e) {
    if (isAxiosError(e) && e.response?.status === 404) return null
    throw e
  }
}
