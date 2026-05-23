"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [sending, setSending] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [error, setError] = useState("")

  /** 发送验证码 */
  const sendCode = async () => {
    if (!email) {
      setError("请输入邮箱")
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("邮箱格式不正确")
      return
    }

    setSending(true)
    setError("")

    try {
      const res = await fetch("/api/auth/send-email-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "reset" }),
      })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error?.message ?? "发送失败")
        return
      }

      // 开始倒计时
      setCountdown(60)
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch {
      setError("发送失败，请稍后重试")
    } finally {
      setSending(false)
    }
  }

  /** 下一步 */
  const handleNext = () => {
    if (!code || code.length !== 6) {
      setError("请输入6位验证码")
      return
    }
    router.push(`/reset-password?email=${encodeURIComponent(email)}&code=${code}`)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#FFF8E1] dark:bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Image
            src="/images/brand/app-icon.png"
            alt="童行"
            width={96}
            height={96}
            className="mx-auto mb-4 rounded-2xl"
            priority
          />
          <h1 className="text-3xl font-bold text-[#4CAF50]">童行</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">找回密码</p>
        </div>

        {/* 找回密码卡片 */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">找回密码</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="请输入注册邮箱"
                className="w-full h-12 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-base bg-transparent focus:outline-none focus:border-[#4CAF50]"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">验证码</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="请输入6位验证码"
                  className="flex-1 h-12 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-base bg-transparent focus:outline-none focus:border-[#4CAF50]"
                />
                <button
                  onClick={sendCode}
                  disabled={countdown > 0 || sending}
                  className="shrink-0 h-12 px-4 text-sm text-[#4CAF50] border border-[#4CAF50] rounded-xl disabled:text-gray-400 disabled:border-gray-200"
                >
                  {sending ? "发送中..." : countdown > 0 ? `${countdown}秒` : "获取验证码"}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">开发模式：任意6位数字即可</p>
            </div>

            <button
              onClick={handleNext}
              className="w-full h-12 bg-[#4CAF50] text-white font-medium rounded-xl hover:bg-[#43A047]"
            >
              下一步
            </button>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              想起密码了？
              <Link href="/login" className="text-[#4CAF50] ml-1">登录</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
