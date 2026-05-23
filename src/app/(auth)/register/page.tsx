"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [nickname, setNickname] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleRegister = async () => {
    // 校验
    if (!email) {
      setError("请输入邮箱")
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("邮箱格式不正确")
      return
    }
    if (!password || password.length < 6) {
      setError("密码至少需要6位")
      return
    }
    if (password !== confirmPassword) {
      setError("两次密码不一致")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, nickname: nickname || undefined }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error?.message ?? "注册失败")
        return
      }

      // 注册成功，跳转到登录页
      router.push("/login")
    } catch {
      setError("注册失败，请稍后重试")
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
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">创建账号，开始成长之旅</p>
        </div>

        {/* 注册卡片 */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">邮箱注册</h2>

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
                placeholder="请输入邮箱"
                className="w-full h-12 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-base bg-transparent focus:outline-none focus:border-[#4CAF50]"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">昵称（可选）</label>
              <input
                type="text"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder="给自己起个名字"
                className="w-full h-12 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-base bg-transparent focus:outline-none focus:border-[#4CAF50]"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">密码</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="至少6位"
                className="w-full h-12 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-base bg-transparent focus:outline-none focus:border-[#4CAF50]"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">确认密码</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="再次输入密码"
                className="w-full h-12 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-base bg-transparent focus:outline-none focus:border-[#4CAF50]"
              />
            </div>

            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full h-12 bg-[#4CAF50] text-white font-medium rounded-xl hover:bg-[#43A047] disabled:opacity-50"
            >
              {loading ? "注册中..." : "注册"}
            </button>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              已有账号？
              <Link href="/login" className="text-[#4CAF50] ml-1">登录</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
