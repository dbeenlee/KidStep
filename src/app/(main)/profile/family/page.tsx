"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  UserPlus,
  Copy,
  Check,
  Trash2,
  Users,
  Clock,
  UserCheck,
} from "lucide-react"
import dayjs from "dayjs"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"

interface InvitationTarget {
  id: string
  nickname: string | null
  phone: string
}

interface Invitation {
  id: string
  code: string
  role: string
  status: string
  createdAt: string
  target: InvitationTarget | null
}

/** 状态标签配置 */
const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "等待中", color: "text-orange-500 bg-orange-50 dark:bg-orange-900/30", icon: Clock },
  accepted: { label: "已加入", color: "text-green-600 bg-green-50 dark:bg-green-900/30", icon: UserCheck },
  expired: { label: "已过期", color: "text-gray-400 bg-gray-50 dark:bg-gray-800", icon: Clock },
}

export default function FamilyPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  /** 加载邀请列表 */
  const loadInvitations = useCallback(async () => {
    try {
      const res = await fetch("/api/invitations")
      const data = await res.json()
      if (data.success) {
        setInvitations(data.data)
      }
    } catch {
      setError("加载失败，请刷新重试")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadInvitations()
  }, [loadInvitations])

  /** 创建邀请 */
  async function handleCreateInvitation() {
    setCreating(true)
    setError(null)
    try {
      const res = await fetch("/api/invitations", { method: "POST" })
      const data = await res.json()
      if (data.success) {
        await loadInvitations()
      } else {
        setError(data.error?.message ?? "创建失败")
      }
    } catch {
      setError("网络错误，请重试")
    } finally {
      setCreating(false)
    }
  }

  /** 复制邀请码 */
  async function handleCopy(code: string, id: string) {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // 降级：选中文本
      const input = document.createElement("input")
      input.value = code
      document.body.appendChild(input)
      input.select()
      document.execCommand("copy")
      document.body.removeChild(input)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  /** 删除邀请 */
  async function handleDelete(id: string) {
    if (!confirm("确定删除此邀请？")) return
    try {
      const res = await fetch(`/api/invitations/${id}`, { method: "DELETE" })
      if (res.ok) {
        setInvitations((prev) => prev.filter((inv) => inv.id !== id))
      }
    } catch {
      setError("删除失败，请重试")
    }
  }

  return (
    <div className="px-4 py-6 max-w-lg md:max-w-2xl mx-auto">
      {/* 顶部导航 */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/profile"
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="返回个人中心"
        >
          <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
        </Link>
        <h1 className="text-xl md:text-2xl font-bold">家庭成员</h1>
      </div>

      {/* 说明文字 */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 mb-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-[#4CAF50]/20 flex items-center justify-center flex-shrink-0">
            <Users size={20} className="text-[#4CAF50]" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              邀请家人一起关注孩子的成长
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              分享邀请码，家人加入后可查看孩子的成长数据
            </p>
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div
          className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl mb-4"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* 生成邀请码按钮 */}
      <button
        onClick={handleCreateInvitation}
        disabled={creating}
        className="w-full flex items-center justify-center gap-2 bg-[#4CAF50] text-white py-3 rounded-xl font-medium hover:bg-[#43A047] active:bg-[#388E3C] disabled:opacity-50 transition-colors mb-6"
        aria-label="生成邀请码"
      >
        <UserPlus size={18} />
        {creating ? "生成中..." : "生成邀请码"}
      </button>

      {/* 加载状态 */}
      {loading ? (
        <LoadingSpinner showText />
      ) : invitations.length === 0 ? (
        /* 空状态 */
        <div className="bg-white dark:bg-gray-900 rounded-xl p-8 text-center shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
            <Users size={28} className="text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            还没有邀请记录
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
            点击上方按钮生成邀请码
          </p>
        </div>
      ) : (
        /* 邀请列表 */
        <div className="space-y-3">
          {invitations.map((inv) => {
            const config = statusConfig[inv.status] ?? statusConfig.pending
            const StatusIcon = config.icon
            const displayCode = inv.code.match(/.{1,3}/g)?.join(" ") ?? inv.code

            return (
              <div
                key={inv.id}
                className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm"
              >
                {/* 邀请码区域 */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">
                      邀请码
                    </p>
                    <p className="text-2xl font-mono font-bold tracking-widest text-gray-800 dark:text-gray-100">
                      {displayCode}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopy(inv.code, inv.id)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label={copiedId === inv.id ? "已复制" : "复制邀请码"}
                  >
                    {copiedId === inv.id ? (
                      <Check size={18} className="text-[#4CAF50]" />
                    ) : (
                      <Copy size={18} className="text-gray-400" />
                    )}
                  </button>
                </div>

                {/* 状态和成员信息 */}
                <div className="flex items-center justify-between border-t border-gray-50 dark:border-gray-800 pt-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}
                    >
                      <StatusIcon size={12} />
                      {config.label}
                    </span>
                    {inv.target && (
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {inv.target.nickname ?? "家人"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {dayjs(inv.createdAt).format("MM-DD HH:mm")}
                    </span>
                    {inv.status === "pending" && (
                      <button
                        onClick={() => handleDelete(inv.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                        aria-label="删除邀请"
                      >
                        <Trash2 size={14} className="text-gray-400 hover:text-red-500" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
