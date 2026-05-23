"use client"

import Link from "next/link"
import { Home, ArrowLeft } from "lucide-react"

export default function MainNotFound() {
  return (
    <div className="px-4 py-12 max-w-lg md:max-w-2xl mx-auto text-center">
      <p className="text-6xl font-bold text-[#4CAF50] mb-4">404</p>
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
        页面不存在
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        你访问的页面可能已被移除或地址有误
      </p>
      <div className="flex flex-col gap-3">
        <Link
          href="/home"
          className="flex items-center justify-center gap-2 h-11 px-6 bg-[#4CAF50] text-white rounded-xl font-medium hover:bg-[#4CAF50]/90 active:scale-[0.98] transition-transform"
        >
          <Home size={18} />
          返回首页
        </Link>
        <button
          onClick={() => window.history.back()}
          className="flex items-center justify-center gap-2 h-11 px-6 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-[0.98] transition-transform"
        >
          <ArrowLeft size={18} />
          返回上一页
        </button>
      </div>
    </div>
  )
}
