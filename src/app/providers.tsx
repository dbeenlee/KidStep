"use client"

import { type ReactNode } from "react"
import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "@/contexts/ThemeContext"
import { ToastProvider } from "@/contexts/ToastContext"
import * as ToastPrimitive from "@radix-ui/react-toast"

/** 客户端Provider包装器 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <ToastPrimitive.Provider swipeDirection="right">
          <ToastProvider>{children}</ToastProvider>
          <ToastPrimitive.Viewport />
        </ToastPrimitive.Provider>
      </ThemeProvider>
    </SessionProvider>
  )
}
