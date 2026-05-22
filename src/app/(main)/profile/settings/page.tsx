"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Bell,
  Clock,
  Palette,
  Trash2,
  Info,
  MessageSquare,
  LogOut,
  ChevronRight,
} from "lucide-react"
import { ThemeToggle } from "@/components/business/ThemeToggle"

export default function SettingsPage() {
  const router = useRouter()

  const [notifications, setNotifications] = useState(true)
  const [pushTime, setPushTime] = useState("08:00")

  /** 清除缓存 */
  function handleClearCache() {
    if (!window.confirm("确定要清除本地缓存吗？")) return
    try {
      localStorage.clear()
      sessionStorage.clear()
      alert("缓存已清除")
    } catch {
      // 静默处理
    }
  }

  /** 退出登录 */
  function handleLogout() {
    if (!window.confirm("确定要退出登录吗？")) return
    // 清除本地状态后跳转登录页
    localStorage.clear()
    router.push("/login")
  }

  return (
    <div className="px-4 py-6 max-w-lg md:max-w-2xl mx-auto">
      {/* 顶部导航 */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 touch-target"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl md:text-2xl font-bold">设置</h1>
      </div>

      {/* 主题设置 */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden mb-4">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
              <Palette size={16} className="text-purple-500" />
            </div>
            <span className="text-sm font-medium">外观主题</span>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* 通知设置 */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden mb-4">
        <div className="p-4 border-b border-gray-50 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#FF9800]/10 flex items-center justify-center">
                <Bell size={16} className="text-[#FF9800]" />
              </div>
              <span className="text-sm">消息通知</span>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`w-12 h-7 rounded-full transition-colors relative ${
                notifications ? "bg-[#4CAF50]" : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span
                className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  notifications ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                <Clock size={16} className="text-blue-500" />
              </div>
              <span className="text-sm">推送时间</span>
            </div>
            <input
              type="time"
              value={pushTime}
              onChange={e => setPushTime(e.target.value)}
              className="text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-transparent focus:outline-none focus:border-[#4CAF50]"
            />
          </div>
        </div>
      </div>

      {/* 其他设置 */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden mb-4">
        <button
          onClick={handleClearCache}
          className="w-full flex items-center justify-between p-4 border-b border-gray-50 dark:border-gray-800 active:bg-gray-50 dark:active:bg-gray-800 transition-colors touch-target"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
              <Trash2 size={16} className="text-red-500" />
            </div>
            <span className="text-sm">清除缓存</span>
          </div>
          <ChevronRight size={16} className="text-gray-300" />
        </button>

        <a
          href="#"
          className="flex items-center justify-between p-4 border-b border-gray-50 dark:border-gray-800 active:bg-gray-50 dark:active:bg-gray-800 transition-colors touch-target"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Info size={16} className="text-gray-600 dark:text-gray-400" />
            </div>
            <span className="text-sm">关于我们</span>
          </div>
          <ChevronRight size={16} className="text-gray-300" />
        </a>

        <a
          href="#"
          className="flex items-center justify-between p-4 active:bg-gray-50 dark:active:bg-gray-800 transition-colors touch-target"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#4CAF50]/10 flex items-center justify-center">
              <MessageSquare size={16} className="text-[#4CAF50]" />
            </div>
            <span className="text-sm">意见反馈</span>
          </div>
          <ChevronRight size={16} className="text-gray-300" />
        </a>
      </div>

      {/* 退出登录 */}
      <button
        onClick={handleLogout}
        className="w-full h-12 bg-white dark:bg-gray-900 text-red-500 rounded-xl font-medium flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-transform touch-target"
      >
        <LogOut size={18} />
        退出登录
      </button>
    </div>
  )
}
