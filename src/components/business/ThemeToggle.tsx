"use client"

import { Sun, Moon, Monitor } from "lucide-react"
import { useTheme, type Theme } from "@/contexts/ThemeContext"
import { cn } from "@/lib/utils"

/** 主题选项配置 */
const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "浅色", icon: Sun },
  { value: "dark", label: "深色", icon: Moon },
  { value: "system", label: "自动", icon: Monitor },
]

/** 主题切换组件 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
      {themeOptions.map(option => (
        <button
          key={option.value}
          onClick={() => setTheme(option.value)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            theme === option.value
              ? "bg-white dark:bg-gray-700 text-[#4CAF50] shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          )}
        >
          <option.icon size={16} />
          {option.label}
        </button>
      ))}
    </div>
  )
}
