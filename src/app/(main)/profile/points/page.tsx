"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  CalendarCheck,
  ClipboardCheck,
  BarChart3,
  Trophy,
  Flame,
  Gift,
} from "lucide-react"
import { useChildStore } from "@/stores/useChildStore"
import { useToast } from "@/hooks/useToast"

/** 积分来源配置 */
const sourceConfig: Record<string, { icon: typeof Gift; color: string; label: string }> = {
  CHECKIN: { icon: CalendarCheck, color: "text-green-500 bg-green-50 dark:bg-green-900/30", label: "打卡" },
  TASK_COMPLETE: { icon: ClipboardCheck, color: "text-blue-500 bg-blue-50 dark:bg-blue-900/30", label: "任务" },
  ASSESSMENT: { icon: BarChart3, color: "text-purple-500 bg-purple-50 dark:bg-purple-900/30", label: "评估" },
  MILESTONE: { icon: Trophy, color: "text-orange-500 bg-orange-50 dark:bg-orange-900/30", label: "里程碑" },
  STREAK: { icon: Flame, color: "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/30", label: "连续打卡" },
}

/** 筛选标签 */
const filterTabs = [
  { value: "", label: "全部" },
  { value: "CHECKIN", label: "打卡" },
  { value: "TASK_COMPLETE", label: "任务" },
  { value: "ASSESSMENT", label: "评估" },
  { value: "MILESTONE", label: "里程碑" },
  { value: "STREAK", label: "连续打卡" },
]

interface PointItem {
  id: string
  amount: number
  reason: string
  source: string
  createdAt: string
}

interface PointsSummary {
  totalPoints: number
  monthTotal: number
  thisWeekTotal: number
}

/** 格式化时间 */
function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "刚刚"
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`

  return `${date.getMonth() + 1}月${date.getDate()}日`
}

export default function PointsPage() {
  const { currentChild } = useChildStore()
  const { error: showError } = useToast()

  const [summary, setSummary] = useState<PointsSummary | null>(null)
  const [items, setItems] = useState<PointItem[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const loadingRef = useRef(false)
  const [activeSource, setActiveSource] = useState("")

  /** 加载积分概览 */
  useEffect(() => {
    async function loadSummary() {
      if (!currentChild) return
      try {
        const res = await fetch(`/api/points?childId=${currentChild.id}`)
        const data = await res.json()
        if (data.success) {
          setSummary({
            totalPoints: data.data.totalPoints,
            monthTotal: data.data.monthTotal,
            thisWeekTotal: data.data.thisWeekTotal,
          })
        }
      } catch (err) {
        console.error("加载积分概览失败:", err)
        showError("加载积分数据失败")
      }
    }
    loadSummary()
  }, [currentChild, showError])

  /** 加载积分历史 */
  const loadHistory = useCallback(
    async (pageNum: number, source: string, append: boolean) => {
      if (!currentChild || loadingRef.current) return
      loadingRef.current = true
      setLoading(true)
      try {
        const params = new URLSearchParams({
          childId: currentChild.id,
          page: String(pageNum),
          pageSize: "20",
        })
        if (source) params.set("source", source)

        const res = await fetch(`/api/points/history?${params}`)
        const data = await res.json()
        if (data.success) {
          setItems(prev => (append ? [...prev, ...data.data.items] : data.data.items))
          setTotalPages(data.data.totalPages)
          setPage(pageNum)
        }
      } catch (err) {
        console.error("加载积分历史失败:", err)
        showError("加载积分记录失败")
      } finally {
        loadingRef.current = false
        setLoading(false)
      }
    },
    [currentChild, activeSource]
  )

  /** 切换来源筛选 */
  useEffect(() => {
    setItems([])
    setPage(1)
    loadHistory(1, activeSource, false)
  }, [activeSource, loadHistory])

  /** 初始加载 */
  useEffect(() => {
    if (currentChild) {
      loadHistory(1, "", false)
    }
  }, [currentChild, loadHistory])

  /** 加载更多 */
  function handleLoadMore() {
    if (page < totalPages) {
      loadHistory(page + 1, activeSource, true)
    }
  }

  /** 获取来源图标和颜色 */
  function getSourceStyle(source: string) {
    return sourceConfig[source] ?? { icon: Gift, color: "text-gray-500 bg-gray-50 dark:bg-gray-800", label: "其他" }
  }

  if (!currentChild) {
    return (
      <div className="px-4 py-6 max-w-lg md:max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/profile" className="p-1" aria-label="返回">
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
          </Link>
          <h1 className="text-xl font-bold">积分明细</h1>
        </div>
        <p className="text-center text-gray-500 dark:text-gray-400 py-12">
          请先选择一个孩子
        </p>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 max-w-lg md:max-w-2xl mx-auto">
      {/* 页面标题 */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/profile" className="p-1" aria-label="返回">
          <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
        </Link>
        <h1 className="text-xl md:text-2xl font-bold">积分明细</h1>
      </div>

      {/* 积分概览卡片 */}
      {summary && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">总积分</p>
            <p className="text-2xl font-bold text-[#FF9800]">{summary.totalPoints}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">本月获得</p>
            <p className="text-2xl font-bold text-[#4CAF50]">{summary.monthTotal}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">本周获得</p>
            <p className="text-2xl font-bold text-[#2196F3]">{summary.thisWeekTotal}</p>
          </div>
        </div>
      )}

      {/* 来源筛选 */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide" role="tablist">
        {filterTabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveSource(tab.value)}
            role="tab"
            aria-selected={activeSource === tab.value}
            className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
              activeSource === tab.value
                ? "bg-[#4CAF50] text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 积分历史列表 */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden">
        {items.length === 0 && !loading ? (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">
            暂无积分记录
          </div>
        ) : (
          items.map((item, index) => {
            const style = getSourceStyle(item.source)
            const Icon = style.icon
            return (
              <div
                key={item.id}
                className={`flex items-center gap-3 p-4 ${
                  index > 0 ? "border-t border-gray-50 dark:border-gray-800" : ""
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${style.color}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{item.reason}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {formatTime(item.createdAt)}
                  </p>
                </div>
                <span className="text-sm font-semibold text-[#FF9800] whitespace-nowrap">
                  +{item.amount}
                </span>
              </div>
            )
          })
        )}

        {/* 加载状态 */}
        {loading && (
          <div className="py-4 text-center text-gray-500 dark:text-gray-400 text-sm">
            加载中...
          </div>
        )}
      </div>

      {/* 加载更多 */}
      {!loading && page < totalPages && items.length > 0 && (
        <button
          onClick={handleLoadMore}
          className="w-full mt-4 py-3 text-sm text-[#4CAF50] bg-white dark:bg-gray-900 rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          加载更多
        </button>
      )}
    </div>
  )
}
