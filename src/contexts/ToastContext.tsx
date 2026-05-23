"use client"

import { createContext, useState, useCallback, type ReactNode } from "react"
import { Toast, type ToastVariant } from "@/components/ui/Toast"

interface ToastOptions {
  variant?: ToastVariant
  title?: string
  description?: string
  duration?: number
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [toastData, setToastData] = useState<ToastOptions>({})

  const toast = useCallback((options: ToastOptions) => {
    setToastData(options)
    setOpen(true)
  }, [])

  const success = useCallback(
    (message: string) => {
      toast({ variant: "success", title: "成功", description: message })
    },
    [toast]
  )

  const error = useCallback(
    (message: string) => {
      toast({ variant: "error", title: "错误", description: message })
    },
    [toast]
  )

  const info = useCallback(
    (message: string) => {
      toast({ variant: "info", title: "提示", description: message })
    },
    [toast]
  )

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}
      <Toast
        open={open}
        onOpenChange={setOpen}
        variant={toastData.variant}
        title={toastData.title}
        description={toastData.description}
        duration={toastData.duration}
      />
    </ToastContext.Provider>
  )
}
