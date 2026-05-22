"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, FileText, X } from "lucide-react"
import { useChildStore } from "@/stores/useChildStore"
import { TimelineItem } from "@/components/business/TimelineItem"
import dayjs from "dayjs"

/** 里程碑数据类型 */
interface Milestone {
  id: string
  childId: string
  type: string
  content: string | null
  mediaUrls: string | null
  createdAt: string
}

/** 按月分组的时间轴数据 */
interface MonthGroup {
  label: string
  items: Milestone[]
}

/** 里程碑类型选项 */
const milestoneTypes = [
  { value: "TEXT", label: "文字记录" },
  { value: "PHOTO", label: "照片" },
  { value: "ASSESSMENT", label: "评估记录" },
]

export default function ArchivePage() {
  const router = useRouter()
  const { currentChild } = useChildStore()

  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [monthGroups, setMonthGroups] = useState<MonthGroup[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState("TEXT")
  const [formContent, setFormContent] = useState("")
  const [loading, setLoading] = useState(false)

  /** 加载里程碑数据 */
  const loadMilestones = useCallback(async () => {
    if (!currentChild) return
    try {
      const res = await fetch(`/api/milestones?childId=${currentChild.id}`)
      const data = await res.json()
      if (data.success) {
        setMilestones(data.data)
      }
    } catch {
      // 静默处理
    }
  }, [currentChild])

  useEffect(() => {
    loadMilestones()
  }, [loadMilestones])

  /** 按月分组 */
  useEffect(() => {
    const groups: Record<string, Milestone[]> = {}
    milestones.forEach(m => {
      const key = dayjs(m.createdAt).format("YYYY年MM月")
      if (!groups[key]) groups[key] = []
      groups[key].push(m)
    })
    setMonthGroups(
      Object.entries(groups).map(([label, items]) => ({ label, items }))
    )
  }, [milestones])

  /** 添加里程碑 */
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!currentChild || !formContent.trim()) return

    setLoading(true)
    try {
      const res = await fetch("/api/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: currentChild.id,
          type: formType,
          content: formContent.trim(),
        }),
      })
      const data = await res.json()
      if (data.success) {
        setMilestones(prev => [data.data, ...prev])
        setFormContent("")
        setShowForm(false)
      }
    } catch {
      // 静默处理
    } finally {
      setLoading(false)
    }
  }

  /** 删除里程碑 */
  async function handleDelete(id: string) {
    if (!window.confirm("确定要删除这条记录吗？")) return

    try {
      const res = await fetch(`/api/milestones/${id}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (data.success) {
        setMilestones(prev => prev.filter(m => m.id !== id))
      }
    } catch {
      // 静默处理
    }
  }

  if (!currentChild) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">成长档案</h1>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-sm text-center">
          <p className="text-gray-400 dark:text-gray-500 text-sm">请先选择一个孩子</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* 顶部导航 */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">成长档案</h1>
      </div>

      {/* 添加按钮 */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full h-11 bg-[#4CAF50] text-white rounded-xl font-medium flex items-center justify-center gap-2 mb-6 active:scale-[0.98] transition-transform"
        >
          <Plus size={18} />
          记录里程碑
        </button>
      )}

      {/* 添加表单 */}
      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">记录里程碑</h3>
            <button
              onClick={() => setShowForm(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleAdd} className="space-y-3">
            {/* 类型选择 */}
            <div className="flex gap-2">
              {milestoneTypes.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setFormType(t.value)}
                  className={`flex-1 h-9 rounded-lg text-xs transition-colors ${
                    formType === t.value
                      ? "bg-[#4CAF50] text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* 内容 */}
            <textarea
              value={formContent}
              onChange={e => setFormContent(e.target.value)}
              placeholder="记录这个重要时刻..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm resize-none focus:outline-none focus:border-[#4CAF50] bg-transparent"
              required
            />

            <button
              type="submit"
              disabled={loading || !formContent.trim()}
              className="w-full h-10 bg-[#4CAF50] text-white rounded-xl font-medium text-sm disabled:opacity-50 active:scale-[0.98] transition-transform"
            >
              {loading ? "保存中..." : "保存"}
            </button>
          </form>
        </div>
      )}

      {/* 时间轴 */}
      {monthGroups.length > 0 ? (
        <div className="space-y-6">
          {monthGroups.map(group => (
            <div key={group.label}>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                {group.label}
              </h3>
              <div className="relative pl-6 border-l-2 border-gray-200 dark:border-gray-700 space-y-4">
                {group.items.map(item => (
                  <TimelineItem
                    key={item.id}
                    milestone={item}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-sm text-center">
          <p className="text-gray-400 dark:text-gray-500 text-sm">还没有成长记录</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
            点击上方按钮记录第一个里程碑
          </p>
        </div>
      )}

      {/* 生成报告入口 */}
      {milestones.length > 0 && (
        <div className="mt-8">
          <button className="w-full h-12 bg-[#FF9800] text-white rounded-xl font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
            <FileText size={18} />
            生成入学准备报告
          </button>
        </div>
      )}
    </div>
  )
}
