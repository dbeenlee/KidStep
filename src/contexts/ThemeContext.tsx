"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

/** 主题类型 */
export type Theme = "light" | "dark" | "system"

/** 主题上下文类型 */
interface ThemeContextType {
  theme: Theme
  resolvedTheme: "light" | "dark"
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

/** 获取系统主题偏好 */
function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

/** 解析实际主题 */
function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") return getSystemTheme()
  return theme
}

/** 主题提供者组件 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system")
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light")

  // 初始化：从localStorage读取偏好
  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null
    if (saved && ["light", "dark", "system"].includes(saved)) {
      setThemeState(saved)
    }
    setResolvedTheme(resolveTheme(saved ?? "system"))
  }, [])

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => {
      if (theme === "system") {
        setResolvedTheme(getSystemTheme())
      }
    }
    mediaQuery.addEventListener("change", handler)
    return () => mediaQuery.removeEventListener("change", handler)
  }, [theme])

  // 应用主题到DOM
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(resolvedTheme)
    // 设置meta主题色
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      meta.setAttribute("content", resolvedTheme === "dark" ? "#1a1a1a" : "#4CAF50")
    }
  }, [resolvedTheme])

  // 设置主题
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    setResolvedTheme(resolveTheme(newTheme))
    localStorage.setItem("theme", newTheme)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

/** 使用主题的Hook */
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  return context
}
