"use client"

import { useCallback, useEffect, useState } from "react"
import { isAxiosError } from "axios"
import { Bot, Check, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { BotWhatsAppMessageContent } from "@/components/messages/bot-whatsapp-message-content"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  fetchBotPersonalities,
  patchAdminBusinessConfig,
  type BotPersonalityOption,
  type BotPersonalitySampleResponse,
} from "@/lib/requests/business-config"
import { parseBotUserMessage } from "@/lib/whatsapp-bot-message"

interface BotPersonalitySelectorProps {
  selectedPersonalityId: string
  onPersonalityUpdated: () => void
}

function ConversationSample({
  sample,
}: {
  sample: BotPersonalitySampleResponse
}) {
  const isStructuredBotMessage = parseBotUserMessage(sample.response) !== null

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-start">
        <div className="max-w-[90%] rounded-2xl rounded-bl-md bg-muted px-3 py-2">
          <p className="text-sm leading-relaxed">{sample.question}</p>
        </div>
      </div>
      <div className="flex justify-end">
        <div className="max-w-[90%] rounded-2xl rounded-br-md bg-primary px-3 py-2 text-primary-foreground">
          <BotWhatsAppMessageContent content={sample.response} />
          {!isStructuredBotMessage ? (
            <div className="mt-1 flex items-center justify-end gap-1 text-primary-foreground/70">
              <Bot className="size-4" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function BotPersonalitySelector({
  selectedPersonalityId,
  onPersonalityUpdated,
}: BotPersonalitySelectorProps) {
  const [personalities, setPersonalities] = useState<BotPersonalityOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectingId, setSelectingId] = useState<string | null>(null)

  const loadPersonalities = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchBotPersonalities()
      setPersonalities(data)
    } catch (e) {
      const message = isAxiosError(e)
        ? (e.response?.data as { message?: string; error?: string })?.message ??
          (e.response?.data as { message?: string; error?: string })?.error ??
          e.message
        : "No se pudieron cargar las personalidades del bot."
      toast.error(
        typeof message === "string" && message
          ? message
          : "No se pudieron cargar las personalidades del bot.",
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPersonalities()
  }, [loadPersonalities])

  const handleSelect = async (personality: BotPersonalityOption) => {
    if (personality.id === selectedPersonalityId) return

    setSelectingId(personality.id)
    try {
      await patchAdminBusinessConfig({ bot_personality_id: personality.id })
      onPersonalityUpdated()
      toast.success(`Personalidad "${personality.name}" activada`)
    } catch (e) {
      const message = isAxiosError(e)
        ? (e.response?.data as { message?: string; error?: string })?.message ??
          (e.response?.data as { message?: string; error?: string })?.error ??
          e.message
        : "No se pudo cambiar la personalidad del bot."
      toast.error(
        typeof message === "string" && message
          ? message
          : "No se pudo cambiar la personalidad del bot.",
      )
    } finally {
      setSelectingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (personalities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay personalidades disponibles en este momento.
      </p>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {personalities.map((personality) => {
        const isSelected = personality.id === selectedPersonalityId
        const isSelecting = selectingId === personality.id

        return (
          <Card
            key={personality.id}
            className="flex flex-col transition-shadow hover:shadow-md"
          >
            <CardHeader className="gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="text-lg">{personality.name}</CardTitle>
                  <CardDescription className="mt-1 line-clamp-3">
                    {personality.description}
                  </CardDescription>
                </div>
                {isSelected ? (
                  <Badge className="shrink-0 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                    <Check className="size-3" />
                    Seleccionada
                  </Badge>
                ) : null}
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Ejemplos de conversación
              </p>
              <div className="max-h-[400px] overflow-y-auto rounded-lg border bg-muted/30 p-3">
                <div className="flex flex-col gap-4">
                  {personality.sample_responses.map((sample) => (
                    <ConversationSample
                      key={`${personality.id}-${sample.question}`}
                      sample={sample}
                    />
                  ))}
                </div>
              </div>
            </CardContent>

            {!isSelected ? (
              <CardFooter className="mt-auto justify-end border-t bg-muted/20 pt-4">
                <Button
                  type="button"
                  disabled={selectingId !== null}
                  onClick={() => void handleSelect(personality)}
                >
                  {isSelecting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Guardando…
                    </>
                  ) : (
                    "Usar esta personalidad"
                  )}
                </Button>
              </CardFooter>
            ) : null}
          </Card>
        )
      })}
    </div>
  )
}
