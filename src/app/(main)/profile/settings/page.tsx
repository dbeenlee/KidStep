"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
  Link2,
  Check,
  Mail,
  Smartphone,
} from "lucide-react"
import { ThemeToggle } from "@/components/business/ThemeToggle"
import { useToast } from "@/hooks/useToast"
import { Suspense } from "react"

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsContent />
    </Suspense>
  )
}

function SettingsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { success, error: showError } = useToast()

  const [notifications, setNotifications] = useState(true)
  const [pushTime, setPushTime] = useState("08:00")
  const [account, setAccount] = useState<{
    phone: string | null
    email: string | null
    hasWechat: boolean
    hasPassword: boolean
    nickname: string | null
  } | null>(null)
  const [showBindEmail, setShowBindEmail] = useState(false)
  const [bindEmail, setBindEmail] = useState("")
  const [bindPassword, setBindPassword] = useState("")
  const [bindLoading, setBindLoading] = useState(false)

  // 加载账号信息
  useEffect(() => {
    fetch("/api/auth/account")
      .then(r => r.json())
      .then(json => {
        if (json.success) setAccount(json.data)
      })
      .catch(() => {})
  }, [])

  // 处理回调提示
  useEffect(() => {
    const successMsg = searchParams.get("success")
    const errorMsg = searchParams.get("error")
    if (successMsg === "wechat_bound") success("微信绑定成功")
    if (errorMsg === "wechat_already_bound") showError("该微信已被其他账号绑定")
    if (errorMsg === "wechat_bind_failed") showError("微信绑定失败，请重试")
    if (errorMsg === "wechat_not_configured") showError("微信登录暂未开通")
  }, [searchParams, success, showError])

  // 绑定邮箱
  async function handleBindEmail() {
    if (!bindEmail || !bindPassword) return
    setBindLoading(true)
    try {
      const res = await fetch("/api/auth/bind-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: bindEmail, password: bindPassword }),
      })
      const json = await res.json()
      if (!res.ok) {
        showError(json.error?.message ?? "绑定失败")
        return
      }
      success("邮箱绑定成功")
      setShowBindEmail(false)
      setBindEmail("")
      setBindPassword("")
      // 刷新账号信息
      const accountRes = await fetch("/api/auth/account")
      const accountJson = await accountRes.json()
      if (accountJson.success) setAccount(accountJson.data)
    } catch {
      showError("绑定失败，请重试")
    } finally {
      setBindLoading(false)
    }
  }

  /** 清除缓存 */
  function handleClearCache() {
    if (!window.confirm("确定要清除本地缓存吗？")) return
    try {
      localStorage.clear()
      sessionStorage.clear()
      success("缓存已清除")
    } catch {
      // 静默处理
    }
  }

  /** 退出登录 */
  function handleLogout() {
    if (!window.confirm("确定要退出登录吗？")) return
    localStorage.clear()
    router.push("/login")
  }

  // 判断登录方式
  const loginMethod = account?.phone ? "phone" : account?.email ? "email" : "wechat"

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

      {/* 账号绑定 */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden mb-4">
        <div className="p-4 border-b border-gray-50 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#4CAF50]/10 flex items-center justify-center">
              <Link2 size={16} className="text-[#4CAF50]" />
            </div>
            <span className="text-sm font-medium">账号绑定</span>
          </div>
        </div>

        {/* 邮箱状态 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-50 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <Mail size={16} className="text-gray-400" />
            <span className="text-sm">邮箱</span>
          </div>
          {account?.email ? (
            <span className="flex items-center gap-1 text-sm text-[#4CAF50]">
              <Check size={14} />
              {account.email}
            </span>
          ) : (
            <button
              onClick={() => setShowBindEmail(true)}
              className="text-sm text-[#4CAF50] font-medium"
            >
              去绑定
            </button>
          )}
        </div>

        {/* 微信状态 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-50 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05a6.552 6.552 0 0 1-.227-1.76c0-3.77 3.477-6.822 7.767-6.822.283 0 .557.017.831.04C16.756 4.672 13.047 2.188 8.691 2.188zm-2.6 4.17a1.12 1.12 0 1 1 0 2.24 1.12 1.12 0 0 1 0-2.24zm5.198 0a1.12 1.12 0 1 1 0 2.24 1.12 1.12 0 0 1 0-2.24z"/>
            </svg>
            <span className="text-sm">微信</span>
          </div>
          {account?.hasWechat ? (
            <span className="flex items-center gap-1 text-sm text-[#4CAF50]">
              <Check size={14} />
              已绑定
            </span>
          ) : (
            <a
              href="/api/auth/wechat/bind"
              className="text-sm text-[#4CAF50] font-medium"
            >
              去绑定
            </a>
          )}
        </div>

        {/* 手机号状态 */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Smartphone size={16} className="text-gray-400" />
            <span className="text-sm">手机号</span>
          </div>
          {account?.phone ? (
            <span className="flex items-center gap-1 text-sm text-[#4CAF50]">
              <Check size={14} />
              {account.phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2")}
            </span>
          ) : (
            <span className="text-sm text-gray-400">未绑定</span>
          )}
        </div>
      </div>

      {/* 绑定邮箱弹窗 */}
      {showBindEmail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4">绑定邮箱</h3>
            <div className="space-y-3 mb-4">
              <input
                type="email"
                value={bindEmail}
                onChange={e => setBindEmail(e.target.value)}
                placeholder="请输入邮箱"
                className="w-full h-11 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:border-[#4CAF50]"
              />
              <input
                type="password"
                value={bindPassword}
                onChange={e => setBindPassword(e.target.value)}
                placeholder="设置密码（至少6位）"
                className="w-full h-11 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:border-[#4CAF50]"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowBindEmail(false); setBindEmail(""); setBindPassword("") }}
                className="flex-1 h-11 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 text-sm"
              >
                取消
              </button>
              <button
                onClick={handleBindEmail}
                disabled={bindLoading}
                className="flex-1 h-11 bg-[#4CAF50] text-white rounded-xl text-sm font-medium disabled:opacity-50"
              >
                {bindLoading ? "绑定中..." : "确认绑定"}
              </button>
            </div>
          </div>
        </div>
      )}

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
