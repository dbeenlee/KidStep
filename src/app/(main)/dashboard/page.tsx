"use client"

import { useEffect, useState, useCallback } from "react"
import dynamic from "next/dynamic"
import { useChildStore } from "@/stores/useChildStore"
import { useTheme } from "@/contexts/ThemeContext"

/** 动态导入折线图（减少首屏 JS） */
const TrendChart = dynamic(
  () => import("@/components/charts/TrendChart"),
  {
    loading: () => <div className="h-[220px] bg-gray-50 dark:bg-gray-800 rounded-lg animate-pulse" />,
    ssr: false,
  }
)

/** 动态导入饼图 */
const DistributionChart = dynamic(
  () => import("@/components/charts/DistributionChart"),
  {
    loading: () => <div className="h-[240px] bg-gray-50 dark:bg-gray-800 rounded-lg animate-pulse" />,
    ssr: false,
  }
)

interface TypeDistribution {
  type: string
  count: number
  completed: number
}

interface DailyTrend {
  date: string
  total: number
  completed: number
}

interface StatsData {
  total: number
  completed: number
  skipped: number
  pending: number
  completionRate: number
  typeDistribution: TypeDistribution[]
  dailyTrend: DailyTrend[]
}

interface CheckinStats {
  streakDays: number
  weekStats: { completed: number; total: number }
}


export default function DashboardPage() {
  const currentChild = useChildStore(s => s.currentChild)
  const loaded = useChildStore(s => s.loaded)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const [stats, setStats] = useState<StatsData | null>(null)
  const [checkinStats, setCheckinStats] = useState<CheckinStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchData = useCallback(async () => {
    if (!currentChild) return
    setLoading(true)
    setError(false)
    try {
      const [statsRes, checkinRes] = await Promise.all([
        fetch(`/api/tasks/stats?childId=${currentChild.id}`),
        fetch(`/api/checkins/stats?childId=${currentChild.id}`),
      ])
      const statsJson = await statsRes.json()
      const checkinJson = await checkinRes.json()

      if (statsJson.success) setStats(statsJson.data)
      if (checkinJson.success) setCheckinStats(checkinJson.data)
    } catch (err) {
      console.error("加载统计数据失败:", err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [currentChild])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (!loaded) {
    return (
      <div className="px-4 py-6 max-w-lg md:max-w-2xl mx-auto">
        <div className="h-8 w-32 bg-gray-100 dark:bg-gray-800 rounded animate-pulse mx-auto mt-12" />
      </div>
    )
  }

  if (!currentChild) {
    return (
      <div className="px-4 py-6 max-w-lg md:max-w-2xl mx-auto">
        <p className="text-gray-400 dark:text-gray-500 text-center py-12">
          请先添加孩子信息
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="px-4 py-6 max-w-lg md:max-w-2xl mx-auto">
        <h1 className="text-xl md:text-2xl font-bold mb-6">数据驾驶舱</h1>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  if (error && !loading) {
    return (
      <div className="px-4 py-6 max-w-lg md:max-w-2xl mx-auto">
        <h1 className="text-xl md:text-2xl font-bold mb-6">数据驾驶舱</h1>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">数据加载失败</p>
          <button onClick={fetchData} className="px-4 py-2 bg-[#4CAF50] text-white rounded-lg">
            重试
          </button>
        </div>
      </div>
    )
  }

  const weekStats = checkinStats?.weekStats ?? { completed: 0, total: 0 }

  return (
    <div className="px-4 py-6 max-w-lg md:max-w-2xl mx-auto">
      {/* 页面标题 */}
      <h1 className="text-xl md:text-2xl font-bold mb-6">数据驾驶舱</h1>

      {/* 概览卡片 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-[#4CAF50]">{stats?.total ?? 0}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">总任务数</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-[#FF9800]">
            {stats?.completionRate ?? 0}%
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">完成率</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-[#2196F3]">
            {checkinStats?.streakDays ?? 0}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">连续打卡</p>
        </div>
      </div>

      {/* 每日完成趋势 */}
      <section className="mb-6">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
          每日完成趋势
        </h2>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
          {stats?.dailyTrend && (
            <TrendChart data={stats.dailyTrend} isDark={isDark} />
          )}
        </div>
      </section>

      {/* 任务类型分布 */}
      <section className="mb-6">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
          任务类型分布
        </h2>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
          {stats?.typeDistribution && (
            <DistributionChart data={stats.typeDistribution} />
          )}
        </div>
      </section>

      {/* 本周统计 */}
      <section className="mb-6">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
          本周统计
        </h2>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">本周完成</p>
              <p className="text-2xl font-bold mt-1">
                <span className="text-[#4CAF50]">{weekStats.completed}</span>
                <span className="text-gray-400 dark:text-gray-500 text-base">
                  /{weekStats.total}
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-300">完成率</p>
              <p className="text-2xl font-bold text-[#FF9800] mt-1">
                {weekStats.total > 0
                  ? Math.round((weekStats.completed / weekStats.total) * 100)
                  : 0}
                %
              </p>
            </div>
          </div>
          {/* 进度条 */}
          <div className="mt-3 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#4CAF50] rounded-full transition-all"
              style={{
                width: `${
                  weekStats.total > 0
                    ? Math.round((weekStats.completed / weekStats.total) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
