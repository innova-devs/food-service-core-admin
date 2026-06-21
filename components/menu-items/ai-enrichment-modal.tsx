"use client"

import { useState, useEffect, useRef, type KeyboardEvent } from "react"
import { Sparkles, HelpCircle, X, Loader2, AlertTriangle } from "lucide-react"
import { isAxiosError } from "axios"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  generateAiEnrichment,
  saveAiMetadata,
  type AiMetadataDraft,
} from "@/lib/requests/ai-metadata"

interface AiEnrichmentModalProps {
  open: boolean
  menuItemId: string
  menuItemName: string
  source: "generate" | "edit-existing"
  dismissible?: boolean
  initialDraft?: AiMetadataDraft
  onDone: () => void
  onCancel?: () => void
}

type ModalState = "generating" | "review" | "saving" | "error"

function TagInput({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  disabled?: boolean
}) {
  const [inputValue, setInputValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const addTag = (raw: string) => {
    const trimmed = raw.trim().toLowerCase()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
    }
    setInputValue("")
  }

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value.length - 1)
    }
  }

  return (
    <div
      className="flex min-h-10 flex-wrap gap-1.5 cursor-text rounded-md border bg-background px-3 py-2 focus-within:ring-1 focus-within:ring-ring"
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag, i) => (
        <Badge key={i} variant="secondary" className="gap-1 pr-1 text-xs font-normal">
          {tag}
          {!disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                removeTag(i)
              }}
              className="rounded-full p-0.5 hover:bg-muted-foreground/20"
            >
              <X className="size-2.5" />
              <span className="sr-only">Eliminar {tag}</span>
            </button>
          )}
        </Badge>
      ))}
      {!disabled && (
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (inputValue) addTag(inputValue)
          }}
          placeholder={value.length === 0 ? placeholder : ""}
          className="min-w-[120px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      )}
    </div>
  )
}

export function AiEnrichmentModal({
  open,
  menuItemId,
  menuItemName,
  source,
  dismissible = source === "edit-existing",
  initialDraft,
  onDone,
  onCancel,
}: AiEnrichmentModalProps) {
  const [state, setState] = useState<ModalState>("generating")
  const [draft, setDraft] = useState<AiMetadataDraft>({
    display_name: "",
    short_description: "",
    search_keywords: [],
    synonyms: [],
    product_tags: [],
  })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const runGeneration = async () => {
    if (!menuItemId) return
    setState("generating")
    setErrorMessage(null)
    try {
      const result = await generateAiEnrichment(menuItemId)
      setDraft({
        display_name: result.display_name ?? "",
        short_description: result.short_description ?? "",
        search_keywords: result.search_keywords ?? [],
        synonyms: result.synonyms ?? [],
        product_tags: result.product_tags ?? [],
      })
      setState("review")
    } catch (e) {
      const msg = isAxiosError(e)
        ? ((e.response?.data as { error?: string })?.error ?? e.message)
        : "No se pudo conectar con el servicio de IA"
      setErrorMessage(typeof msg === "string" ? msg : "Error al generar los datos")
      setState("error")
    }
  }

  useEffect(() => {
    if (!open) return

    if (source === "edit-existing" && initialDraft) {
      setDraft(initialDraft)
      setState("review")
      setErrorMessage(null)
      return
    }

    void runGeneration()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, menuItemId, source, initialDraft])

  const updateField = <K extends keyof AiMetadataDraft>(
    field: K,
    value: AiMetadataDraft[K],
  ) => {
    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setState("saving")
    try {
      await saveAiMetadata(menuItemId, {
        display_name: draft.display_name || undefined,
        short_description: draft.short_description || undefined,
        search_keywords: draft.search_keywords.length > 0 ? draft.search_keywords : undefined,
        synonyms: draft.synonyms.length > 0 ? draft.synonyms : undefined,
        product_tags: draft.product_tags.length > 0 ? draft.product_tags : undefined,
      })
      toast.success("Datos inteligentes guardados correctamente")
      onDone()
    } catch (e) {
      const msg = isAxiosError(e)
        ? ((e.response?.data as { error?: string })?.error ?? e.message)
        : "No se pudieron guardar los datos"
      setErrorMessage(typeof msg === "string" ? msg : "Error al guardar")
      setState("error")
    }
  }

  const handleCancel = () => {
    if (!dismissible || isBusy) return
    onCancel?.()
  }

  const isBusy = state === "generating" || state === "saving"
  const isEditingExisting = source === "edit-existing"
  const saveLabel = isEditingExisting ? "Guardar cambios" : "Guardar y continuar"

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleCancel()
      }}
    >
      <DialogContent
        className={`max-h-[min(90vh,700px)] max-w-xl overflow-y-auto sm:max-w-xl${dismissible ? "" : " [&>button:last-child]:hidden"}`}
        onInteractOutside={(e) => {
          if (!dismissible) e.preventDefault()
        }}
        onEscapeKeyDown={(e) => {
          if (!dismissible) e.preventDefault()
        }}
      >
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950">
              <Sparkles className="size-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base leading-tight">
                Datos inteligentes del producto
              </DialogTitle>
              <DialogDescription className="mt-1">
                {isEditingExisting
                  ? "Editá los datos inteligentes de "
                  : "Revisá y editá los datos generados para "}
                <span className="font-medium text-foreground">{menuItemName}</span>
                {isEditingExisting ? "." : " antes de guardarlos."}
              </DialogDescription>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="mt-0.5 shrink-0 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="¿Qué es esto?"
                >
                  <HelpCircle className="size-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                side="left"
                align="start"
                className="max-w-64 text-xs leading-relaxed"
              >
                Usamos inteligencia artificial para generar automáticamente el nombre
                comercial, descripción, etiquetas y palabras clave de tu producto. Esto
                mejora cómo aparece en búsquedas, recomendaciones y el menú digital.
                Podés editar todo antes de guardar.
              </PopoverContent>
            </Popover>
          </div>
        </DialogHeader>

        {/* Generating */}
        {state === "generating" && (
          <div className="flex flex-col items-center gap-5 py-12">
            <div className="relative">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-950">
                <Sparkles className="size-8 text-violet-500 dark:text-violet-400" />
              </div>
              <div className="absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full bg-background shadow-sm">
                <Loader2 className="size-4 animate-spin text-violet-500" />
              </div>
            </div>
            <div className="text-center">
              <p className="font-medium">Generando datos inteligentes...</p>
              <p className="mt-1 text-sm text-muted-foreground">
                La IA está analizando tu producto para crear nombre, descripción
                y etiquetas optimizadas.
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {state === "error" && (
          <div className="flex flex-col items-center gap-4 py-10">
            <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/10">
              <AlertTriangle className="size-6 text-destructive" />
            </div>
            <div className="text-center">
              <p className="font-medium">
                {isEditingExisting
                  ? "No se pudieron guardar los datos"
                  : "No se pudieron generar los datos"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{errorMessage}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (isEditingExisting && initialDraft) {
                  setDraft(initialDraft)
                  setState("review")
                  setErrorMessage(null)
                  return
                }
                void runGeneration()
              }}
            >
              {!isEditingExisting && <Loader2 className="mr-2 size-4" />}
              {isEditingExisting ? "Volver a editar" : "Reintentar"}
            </Button>
          </div>
        )}

        {/* Review / Saving */}
        {(state === "review" || state === "saving") && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="ai-display-name">Nombre para mostrar</Label>
                <span
                  className={`tabular-nums text-xs ${
                    draft.display_name.length > 20
                      ? "text-amber-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {draft.display_name.length}/24
                </span>
              </div>
              <Input
                id="ai-display-name"
                value={draft.display_name}
                onChange={(e) => updateField("display_name", e.target.value)}
                maxLength={24}
                disabled={state === "saving"}
                placeholder="Nombre corto del producto"
              />
              <p className="text-xs text-muted-foreground">
                Límite de WhatsApp Business para títulos de lista
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="ai-short-description">Descripción corta</Label>
                <span
                  className={`tabular-nums text-xs ${
                    draft.short_description.length > 60
                      ? "text-amber-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {draft.short_description.length}/72
                </span>
              </div>
              <Textarea
                id="ai-short-description"
                value={draft.short_description}
                onChange={(e) => updateField("short_description", e.target.value)}
                maxLength={72}
                rows={2}
                disabled={state === "saving"}
                placeholder="Descripción breve para el menú digital"
              />
              <p className="text-xs text-muted-foreground">
                Límite de WhatsApp Business para descripciones de lista
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>
                Palabras clave de búsqueda
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  (Enter o coma para agregar)
                </span>
              </Label>
              <TagInput
                value={draft.search_keywords}
                onChange={(tags) => updateField("search_keywords", tags)}
                placeholder="Agregá palabras clave..."
                disabled={state === "saving"}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>
                Sinónimos
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  (Enter o coma para agregar)
                </span>
              </Label>
              <TagInput
                value={draft.synonyms}
                onChange={(tags) => updateField("synonyms", tags)}
                placeholder="Ej: mila napo, milanesa napolitana..."
                disabled={state === "saving"}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>
                Etiquetas del producto
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  (Enter o coma para agregar)
                </span>
              </Label>
              <TagInput
                value={draft.product_tags}
                onChange={(tags) => updateField("product_tags", tags)}
                placeholder="Ej: carne, gratinado, abundante..."
                disabled={state === "saving"}
              />
            </div>
          </div>
        )}

        {(state === "review" || state === "saving") && (
          <DialogFooter className={dismissible ? "gap-2 sm:justify-end" : undefined}>
            {dismissible && (
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={state === "saving"}
              >
                Cancelar
              </Button>
            )}
            <Button
              type="button"
              onClick={handleSave}
              disabled={state === "saving"}
              className="bg-violet-600 text-white hover:bg-violet-700 dark:bg-violet-700 dark:hover:bg-violet-600"
            >
              {state === "saving" && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              {saveLabel}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
