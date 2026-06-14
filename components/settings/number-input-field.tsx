"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const INTEGER_INPUT_REGEX = /^\d*$/

interface NumberInputFieldProps {
  id: string
  label: string
  description?: string
  value: number | null
  onChange: (value: number | null) => void
  disabled?: boolean
  placeholder?: string
  min?: number
}

export function NumberInputField({
  id,
  label,
  description,
  value,
  onChange,
  disabled = false,
  placeholder,
  min = 0,
}: NumberInputFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val === "") {
      onChange(null)
      return
    }
    if (!INTEGER_INPUT_REGEX.test(val)) return

    const num = parseInt(val, 10)
    if (!Number.isNaN(num) && num >= min) {
      onChange(num)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key.length === 1 && !/^\d$/.test(e.key)) {
      e.preventDefault()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text")
    if (!INTEGER_INPUT_REGEX.test(pasted)) {
      e.preventDefault()
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Label
        htmlFor={id}
        className={disabled ? "text-muted-foreground" : ""}
      >
        {label}
      </Label>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={value ?? ""}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        disabled={disabled}
        placeholder={placeholder}
        className="max-w-[200px]"
      />
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  )
}
