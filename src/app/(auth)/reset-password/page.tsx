"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Suspense } from "react"

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  )
}

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") ?? ""
  const initialCode = searchParams.get("code") ?? ""

  const [code, setCode] = useState(initialCode)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  /** 重置密码 */
  const handleReset = async () => {
    if (!code || code.length !== 6) {
      setError("请输入6位验证码")
      return
    }
    if (!newPassword || newPassword.length < 6) {
      setError("密码至少需要6位")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("两次密码不一致")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error?.message ?? "重置失败")
        return
      }

      router.push("/login")
    } catch {
      setError("重置失败，请稍后重试")
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
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">重置密码</p>
        </div>

        {/* 重置密码卡片 */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">重置密码</h2>

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
                readOnly
                className="w-full h-12 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-base bg-gray-50 dark:bg-gray-800 text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">验证码</label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="请输入6位验证码"
                className="w-full h-12 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-base bg-transparent focus:outline-none focus:border-[#4CAF50]"
              />
              <p className="text-xs text-gray-400 mt-2">开发模式：任意6位数字即可</p>
            </div>

            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">新密码</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="至少6位"
                className="w-full h-12 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-base bg-transparent focus:outline-none focus:border-[#4CAF50]"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">确认新密码</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="再次输入新密码"
                className="w-full h-12 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-base bg-transparent focus:outline-none focus:border-[#4CAF50]"
              />
            </div>

            <button
              onClick={handleReset}
              disabled={loading}
              className="w-full h-12 bg-[#4CAF50] text-white font-medium rounded-xl hover:bg-[#43A047] disabled:opacity-50"
            >
              {loading ? "重置中..." : "确认重置"}
            </button>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              <Link href="/login" className="text-[#4CAF50]">返回登录</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
