"use client"

import { useState } from "react"
import { Check, Copy, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface SecretInputFieldProps {
  id: string
  label: string
  description?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  allowCopy?: boolean
  configured?: boolean
  className?: string
}

export function SecretInputField({
  id,
  label,
  description,
  value,
  onChange,
  placeholder,
  disabled = false,
  allowCopy = true,
  configured = false,
  className,
}: SecretInputFieldProps) {
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!value.trim()) {
      toast.error("No hay nada para copiar")
      return
    }
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success("Copiado al portapapeles")
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("No se pudo copiar al portapapeles")
    }
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-col gap-1">
        <Label htmlFor={id}>{label}</Label>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
        {configured ? (
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            Ya configurado. Dejá vacío para mantener el valor actual.
          </p>
        ) : null}
      </div>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-20 font-mono text-sm"
          autoComplete="off"
        />
        <div className="absolute top-0 right-0 flex h-full items-center gap-0.5 pr-1">
          {allowCopy ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground"
              aria-label="Copiar al portapapeles"
              disabled={disabled || !value.trim()}
              onClick={() => void handleCopy()}
            >
              {copied ? (
                <Check className="size-4 text-emerald-600" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-foreground"
            aria-label={visible ? "Ocultar valor" : "Mostrar valor"}
            disabled={disabled}
            onClick={() => setVisible((current) => !current)}
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
