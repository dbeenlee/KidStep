"use client"

import { useEffect } from "react"
import { AlertCircle, RefreshCw, Home } from "lucide-react"
import Link from "next/link"

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("主功能区错误:", error)
  }, [error])

  return (
    <div className="px-4 py-12 max-w-lg md:max-w-2xl mx-auto text-center">
      <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
        <AlertCircle size={32} className="text-red-500" />
      </div>
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
        页面加载失败
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        数据加载时遇到问题，请尝试重试
      </p>
      <div className="flex flex-col gap-3">
        <button
          onClick={reset}
          className="flex items-center justify-center gap-2 h-11 px-6 bg-[#4CAF50] text-white rounded-xl font-medium hover:bg-[#4CAF50]/90 active:scale-[0.98] transition-transform"
        >
          <RefreshCw size={18} />
          重试
        </button>
        <Link
          href="/home"
          className="flex items-center justify-center gap-2 h-11 px-6 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-[0.98] transition-transform"
        >
          <Home size={18} />
          返回首页
        </Link>
      </div>
    </div>
  )
}
