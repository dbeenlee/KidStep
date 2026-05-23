"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import Image from "next/image"
import Link from "next/link"
import { Suspense } from "react"

type LoginMethod = "phone" | "email"

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [method, setMethod] = useState<LoginMethod>("email")

  // 处理微信回调错误
  useEffect(() => {
    const error = searchParams.get("error")
    if (error === "wechat_token_failed" || error === "wechat_userinfo_failed") {
      setError("微信登录失败，请重试")
    } else if (error === "wechat_failed" || error === "wechat_config") {
      setError("微信登录暂未开通")
    }
  }, [searchParams])

  // 手机号登录状态
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [countdown, setCountdown] = useState(0)

  // 邮箱登录状态
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // 发送验证码
  const sendCode = () => {
    if (!phone || phone.length !== 11) {
      setError("请输入正确的手机号")
      return
    }
    setError("")
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

  // 手机号登录
  const handlePhoneLogin = async () => {
    if (!code || code.length !== 6) {
      setError("请输入6位验证码")
      return
    }
    setLoading(true)
    setError("")

    try {
      const result = await signIn("phone", {
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

  // 邮箱登录
  const handleEmailLogin = async () => {
    if (!email) {
      setError("请输入邮箱")
      return
    }
    if (!password) {
      setError("请输入密码")
      return
    }
    setLoading(true)
    setError("")

    try {
      const result = await signIn("email", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("邮箱或密码错误")
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
          {/* Tab 切换 */}
          <div className="flex mb-6 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            <button
              onClick={() => { setMethod("email"); setError("") }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                method === "email"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              邮箱登录
            </button>
            <button
              onClick={() => { setMethod("phone"); setError("") }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                method === "phone"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              手机号登录
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* 邮箱登录表单 */}
          {method === "email" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">邮箱</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="请输入邮箱"
                  className="w-full h-12 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-base bg-transparent focus:outline-none focus:border-[#4CAF50]"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">密码</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full h-12 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-base bg-transparent focus:outline-none focus:border-[#4CAF50]"
                />
              </div>
              <button
                onClick={handleEmailLogin}
                disabled={loading}
                className="w-full h-12 bg-[#4CAF50] text-white font-medium rounded-xl hover:bg-[#43A047] disabled:opacity-50"
              >
                {loading ? "登录中..." : "登录"}
              </button>
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                还没有账号？
                <Link href="/register" className="text-[#4CAF50] ml-1">注册</Link>
              </p>
            </div>
          )}

          {/* 手机号登录表单 */}
          {method === "phone" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">手机号</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                  placeholder="请输入手机号"
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
                    disabled={countdown > 0}
                    className="shrink-0 h-12 px-4 text-sm text-[#4CAF50] border border-[#4CAF50] rounded-xl disabled:text-gray-400 disabled:border-gray-200"
                  >
                    {countdown > 0 ? `${countdown}秒` : "获取验证码"}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">开发模式：任意6位数字即可登录</p>
              </div>
              <button
                onClick={handlePhoneLogin}
                disabled={loading}
                className="w-full h-12 bg-[#4CAF50] text-white font-medium rounded-xl hover:bg-[#43A047] disabled:opacity-50"
              >
                {loading ? "登录中..." : "登录"}
              </button>
            </div>
          )}

          {/* 微信登录 */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white dark:bg-gray-900 px-2 text-gray-400">其他方式</span>
            </div>
          </div>

          <a
            href="/api/auth/wechat/callback"
            className="flex items-center justify-center gap-2 w-full h-12 bg-[#07C160] text-white font-medium rounded-xl hover:bg-[#06AD56]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05a6.552 6.552 0 0 1-.227-1.76c0-3.77 3.477-6.822 7.767-6.822.283 0 .557.017.831.04C16.756 4.672 13.047 2.188 8.691 2.188zm-2.6 4.17a1.12 1.12 0 1 1 0 2.24 1.12 1.12 0 0 1 0-2.24zm5.198 0a1.12 1.12 0 1 1 0 2.24 1.12 1.12 0 0 1 0-2.24zM16.114 8.66c-3.735 0-6.782 2.62-6.782 5.844 0 3.224 3.047 5.844 6.782 5.844a8.25 8.25 0 0 0 2.318-.332.722.722 0 0 1 .59.082l1.555.91a.265.265 0 0 0 .136.044c.131 0 .237-.108.237-.24 0-.06-.023-.116-.039-.174l-.32-1.21a.48.48 0 0 1 .174-.544C22.394 17.86 23.3 16.2 23.3 14.504c0-3.224-3.37-5.844-7.186-5.844zm-2.722 3.392a.916.916 0 1 1 0 1.832.916.916 0 0 1 0-1.832zm5.444 0a.916.916 0 1 1 0 1.832.916.916 0 0 1 0-1.832z"/>
            </svg>
            微信登录
          </a>
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">
          登录即表示同意《用户协议》和《隐私政策》
        </p>
      </div>
    </div>
  )
}
