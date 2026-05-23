"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import Image from "next/image"

export default function LoginPage() {
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const sendCode = async () => {
    if (!phone || phone.length !== 11) {
      setError("请输入正确的手机号")
      return
    }
    setError("")
    // 开发模式：提示任意验证码
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
  }

  const handleLogin = async () => {
    if (!code || code.length !== 6) {
      setError("请输入6位验证码")
      return
    }
    setLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        phone,
        code,
        redirect: false,
      })

      if (result?.error) {
        setError("验证码错误或已过期")
      } else {
        router.push("/home")
      }
    } catch {
      setError("登录失败，请重试")
    } finally {
      setLoading(false)
    }
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
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">每一步，都陪你走</p>
        </div>

        {/* 登录卡片 */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">手机号登录</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* 手机号输入 */}
          <div className="mb-4">
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">手机号</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
              placeholder="请输入手机号"
              className="w-full h-12 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-base bg-transparent focus:outline-none focus:border-[#4CAF50]"
            />
          </div>

          {/* 验证码输入 */}
          <div className="mb-6">
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
                disabled={countdown > 0}
                className="shrink-0 h-12 px-4 text-sm text-[#4CAF50] border border-[#4CAF50] rounded-xl disabled:text-gray-400 disabled:border-gray-200"
              >
                {countdown > 0 ? `${countdown}秒` : "获取验证码"}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">开发模式：任意6位数字即可登录</p>
          </div>

          {/* 登录按钮 */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full h-12 bg-[#4CAF50] text-white font-medium rounded-xl hover:bg-[#43A047] disabled:opacity-50"
          >
            {loading ? "登录中..." : "登录"}
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">
          登录即表示同意《用户协议》和《隐私政策》
        </p>
      </div>
    </div>
  )
}
