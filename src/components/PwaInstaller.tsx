"use client"

import { useEffect, useState } from "react"
import { Download, X } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function PwaInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  // 检查是否已安装
  useEffect(() => {
    const handler = () => setDeferredPrompt(null)
    window.addEventListener("appinstalled", handler)
    return () => window.removeEventListener("appinstalled", handler)
  }, [])

  if (!deferredPrompt || dismissed) return null

  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") {
      setDeferredPrompt(null)
    }
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 z-40">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#4CAF50]/20 flex items-center justify-center flex-shrink-0">
          <Download size={20} className="text-[#4CAF50]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">安装「童行」</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">添加到桌面，随时使用</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleInstall}
            className="px-3 py-1.5 bg-[#4CAF50] text-white text-xs rounded-lg font-medium"
          >
            安装
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 text-gray-400 hover:text-gray-600"
            aria-label="关闭"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
