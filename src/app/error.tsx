"use client"

import { useEffect } from "react"
import { AlertCircle, RefreshCw, Home } from "lucide-react"
import Link from "next/link"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("应用错误:", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <AlertCircle size={32} className="text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
          出了点问题
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          应用遇到了意外错误，请尝试刷新页面
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
    </div>
  )
}
