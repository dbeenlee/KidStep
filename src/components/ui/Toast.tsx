"use client"

import * as ToastPrimitive from "@radix-ui/react-toast"
import { cn } from "@/lib/utils"
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react"
import type { LucideIcon } from "lucide-react"

/** Toast 变体类型 */
export type ToastVariant = "success" | "error" | "info"

interface ToastProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  variant?: ToastVariant
  title?: string
  description?: string
  duration?: number
}

/** 变体样式映射 */
const variantStyles: Record<ToastVariant, string> = {
  success: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950",
  error: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950",
  info: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950",
}

/** 变体图标映射 */
const variantIcons: Record<ToastVariant, LucideIcon> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

export function Toast({
  open,
  onOpenChange,
  variant = "info",
  title,
  description,
  duration = 3000,
}: ToastProps) {
  const Icon = variantIcons[variant]
  return (
    <ToastPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      duration={duration}
      className={cn(
        "fixed bottom-4 right-4 z-50 flex items-start gap-3 rounded-xl border p-4 shadow-lg",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-right-full",
        variantStyles[variant]
      )}
    >
      <Icon
        size={18}
        className={cn(
          variant === "success" && "text-green-600 dark:text-green-400",
          variant === "error" && "text-red-600 dark:text-red-400",
          variant === "info" && "text-blue-600 dark:text-blue-400"
        )}
      />
      <div className="flex-1">
        {title && (
          <ToastPrimitive.Title className="text-sm font-medium">
            {title}
          </ToastPrimitive.Title>
        )}
        {description && (
          <ToastPrimitive.Description className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {description}
          </ToastPrimitive.Description>
        )}
      </div>
      <ToastPrimitive.Close className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
        <X size={16} />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  )
}

/** Toast 视口，放在 Provider 中 */
export function ToastViewport() {
  return <ToastPrimitive.Viewport />
}
