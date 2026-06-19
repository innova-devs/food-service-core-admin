"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"

export function useUnsavedChangesToast(isDirty: boolean, message: string) {
  const hasShownRef = useRef(false)

  useEffect(() => {
    if (isDirty && !hasShownRef.current) {
      hasShownRef.current = true
      toast.warning(message)
    }

    if (!isDirty) {
      hasShownRef.current = false
    }
  }, [isDirty, message])
}
