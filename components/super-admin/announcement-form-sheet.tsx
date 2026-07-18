"use client"

import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { RichTextEditor } from "@/components/editor/rich-text-editor"
import {
  ANNOUNCEMENT_TARGET_ROLES,
  ROLE_LABELS,
} from "./announcement-types"
import type { Announcement, AnnouncementTargetRole } from "./announcement-types"

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const formSchema = z
  .object({
    title: z.string().trim().min(1, "El título es obligatorio").max(255),
    bodyHtml: z.string().trim().min(1, "El contenido es obligatorio"),
    targetRoles: z
      .array(z.enum(["OWNER", "ADMIN", "STAFF", "DELIVERY"] as const))
      .min(1, "Seleccioná al menos un rol"),
    publishedAt: z.date({ required_error: "La fecha de publicación es obligatoria" }),
    expiresAt: z.date().nullable().optional(),
    isActive: z.boolean(),
  })
  .refine(
    (data) =>
      !data.expiresAt || data.expiresAt > data.publishedAt,
    {
      message: "La expiración debe ser posterior a la publicación",
      path: ["expiresAt"],
    },
  )

type FormValues = z.infer<typeof formSchema>

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AnnouncementFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  announcement?: Announcement | null
  onSubmit: (values: FormValues) => Promise<void>
  isSaving: boolean
}

export type AnnouncementFormValues = FormValues

export function AnnouncementFormSheet({
  open,
  onOpenChange,
  announcement,
  onSubmit,
  isSaving,
}: AnnouncementFormSheetProps) {
  const isEditing = Boolean(announcement)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      bodyHtml: "",
      targetRoles: [],
      publishedAt: new Date(),
      expiresAt: null,
      isActive: true,
    },
  })

  // Reset al abrir/cambiar el announcement
  useEffect(() => {
    if (open) {
      if (announcement) {
        form.reset({
          title: announcement.title,
          bodyHtml: announcement.bodyHtml,
          targetRoles: announcement.targetRoles as AnnouncementTargetRole[],
          publishedAt: new Date(announcement.publishedAt),
          expiresAt: announcement.expiresAt ? new Date(announcement.expiresAt) : null,
          isActive: announcement.isActive,
        })
      } else {
        form.reset({
          title: "",
          bodyHtml: "",
          targetRoles: [],
          publishedAt: new Date(),
          expiresAt: null,
          isActive: true,
        })
      }
    }
  }, [open, announcement, form])

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values)
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-xl" style={{ padding: "2rem" }}>
        <SheetHeader className="border-b pb-4">
          <SheetTitle>{isEditing ? "Editar anuncio" : "Nuevo anuncio"}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Modificá los datos del anuncio. El HTML del contenido se sanitiza automáticamente."
              : "Completá los datos para crear un nuevo anuncio de plataforma."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 py-5">
          {/* Título */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              placeholder="Título del anuncio"
              {...form.register("title")}
            />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          {/* Contenido HTML */}
          <div className="flex flex-col gap-1.5">
            <Label>Contenido</Label>
            <Controller
              control={form.control}
              name="bodyHtml"
              render={({ field }) => (
                <RichTextEditor
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Escribí el contenido del anuncio..."
                  minHeight="180px"
                  disabled={isSaving}
                />
              )}
            />
            {form.formState.errors.bodyHtml && (
              <p className="text-xs text-destructive">
                {form.formState.errors.bodyHtml.message}
              </p>
            )}
          </div>

          {/* Roles destino */}
          <div className="flex flex-col gap-2">
            <Label>Dirigido a</Label>
            <Controller
              control={form.control}
              name="targetRoles"
              render={({ field }) => (
                <div className="flex flex-wrap gap-3">
                  {ANNOUNCEMENT_TARGET_ROLES.map((role) => {
                    const checked = field.value.includes(role)
                    return (
                      <div key={role} className="flex items-center gap-2">
                        <Checkbox
                          id={`role-${role}`}
                          checked={checked}
                          onCheckedChange={(v) => {
                            if (v) {
                              field.onChange([...field.value, role])
                            } else {
                              field.onChange(field.value.filter((r) => r !== role))
                            }
                          }}
                        />
                        <Label htmlFor={`role-${role}`} className="cursor-pointer font-normal">
                          {ROLE_LABELS[role]}
                        </Label>
                      </div>
                    )
                  })}
                </div>
              )}
            />
            <p className="text-xs text-muted-foreground">
              Owner siempre ve todos los anuncios vigentes independientemente de esta selección.
            </p>
            {form.formState.errors.targetRoles && (
              <p className="text-xs text-destructive">
                {form.formState.errors.targetRoles.message}
              </p>
            )}
          </div>

          {/* Fecha de publicación */}
          <div className="flex flex-col gap-1.5">
            <Label>Fecha de publicación</Label>
            <Controller
              control={form.control}
              name="publishedAt"
              render={({ field }) => (
                <DateTimePicker value={field.value} onChange={field.onChange} />
              )}
            />
            {form.formState.errors.publishedAt && (
              <p className="text-xs text-destructive">
                {form.formState.errors.publishedAt.message}
              </p>
            )}
          </div>

          {/* Fecha de expiración */}
          <div className="flex flex-col gap-1.5">
            <Label>Fecha de expiración (opcional)</Label>
            <Controller
              control={form.control}
              name="expiresAt"
              render={({ field }) => (
                <DateTimePicker
                  value={field.value ?? undefined}
                  onChange={field.onChange}
                  clearable
                />
              )}
            />
            {form.formState.errors.expiresAt && (
              <p className="text-xs text-destructive">
                {form.formState.errors.expiresAt.message}
              </p>
            )}
          </div>

          {/* Activo (solo en edición) */}
          {isEditing && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex flex-col gap-0.5">
                <Label htmlFor="isActive" className="cursor-pointer">Anuncio activo</Label>
                <p className="text-xs text-muted-foreground">
                  Si está inactivo no aparece en el inbox de ningún negocio.
                </p>
              </div>
              <Controller
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <Switch
                    id="isActive"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
          )}

          <SheetFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEditing ? "Guardar cambios" : "Crear anuncio"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

// ---------------------------------------------------------------------------
// DateTimePicker interno
// ---------------------------------------------------------------------------

function DateTimePicker({
  value,
  onChange,
  clearable = false,
}: {
  value?: Date
  onChange: (date: Date | null) => void
  clearable?: boolean
}) {
  const timeStr = value ? format(value, "HH:mm") : "00:00"

  const handleDaySelect = (day: Date | undefined) => {
    if (!day) {
      if (clearable) onChange(null)
      return
    }
    const [h, m] = timeStr.split(":").map(Number)
    const next = new Date(day)
    next.setHours(h, m, 0, 0)
    onChange(next)
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [h, m] = e.target.value.split(":").map(Number)
    const base = value ?? new Date()
    const next = new Date(base)
    next.setHours(h ?? 0, m ?? 0, 0, 0)
    onChange(next)
  }

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-44 justify-start text-left font-normal",
              !value && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 size-4" />
            {value ? format(value, "dd/MM/yyyy", { locale: es }) : "Elegir fecha"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleDaySelect}
            locale={es}
          />
          {clearable && value && (
            <div className="border-t p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground"
                onClick={() => onChange(null)}
              >
                Quitar fecha
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      <Input
        type="time"
        value={timeStr}
        onChange={handleTimeChange}
        className="w-28"
        disabled={!value && clearable}
      />
    </div>
  )
}
