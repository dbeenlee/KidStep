"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Target, Flame, TrendingUp, Calendar, Trophy, Star } from "lucide-react"
import { useTaskStore } from "@/stores/useTaskStore"
import { useChildStore } from "@/stores/useChildStore"
import { TaskCard } from "@/components/business/TaskCard"
import { CalendarHeatmap } from "@/components/business/CalendarHeatmap"
import { cn, randomItem } from "@/lib/utils"
import { getCurrentPhase } from "@/lib/phaseCalculator"
import { ENCOURAGEMENTS } from "@/constants/encouragements"

/** 打卡统计数据 */
interface CheckinStats {
  streakDays: number
  monthRate: number
  totalCheckinDays: number
  weekStats: { completed: number; total: number }
}

/** 日历日状态 */
interface DayStatus {
  date: string
  completedCount: number
  totalCount: number
  status: "full" | "partial" | "none" | "noTask"
}

/** 三阶段配置 */
const PHASES = [
  {
    phase: "第一阶段",
    time: "入学前3个月",
    goal: "习惯建立、兴趣培养",
    color: "#4CAF50",
    value: "PHASE_1",
  },
  {
    phase: "第二阶段",
    time: "入学前1个月",
    goal: "知识巩固、模拟训练",
    color: "#FF9800",
    value: "PHASE_2",
  },
  {
    phase: "第三阶段",
    time: "入学前2周",
    goal: "作息调整、心理准备",
    color: "#2196F3",
    value: "PHASE_3",
  },
]

export default function PlanPage() {
  const { currentChild } = useChildStore()
  const {
    currentTask,
    allDone,
    summary,
    initQueue,
    completeCurrent,
    skipCurrent,
    updateSummary,
  } = useTaskStore()

  const [stats, setStats] = useState<CheckinStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const currentPhase = useMemo(() => {
    if (!currentChild) return "PHASE_1"
    return getCurrentPhase(currentChild.birthday) ?? "PHASE_1"
  }, [currentChild])

  // 加载今日任务
  const loadTodayTasks = useCallback(async () => {
    if (!currentChild) return
    setLoading(true)
    setError(false)
    try {
      const res = await fetch(`/api/tasks/today?childId=${currentChild.id}`)
      const data = await res.json()
      if (data.success) {
        initQueue(data.data)
        updateSummary({
          total: data.data.length,
          completed: data.data.filter((t: { status: string }) => t.status === "COMPLETED").length,
          skipped: data.data.filter((t: { status: string }) => t.status === "SKIPPED").length,
          pending: data.data.filter((t: { status: string }) => t.status === "PENDING").length,
        })
      }
    } catch (err) {
      console.error("加载今日任务失败:", err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [currentChild, initQueue, updateSummary])

  // 加载打卡统计
  const loadStats = useCallback(async () => {
    if (!currentChild) return
    try {
      const res = await fetch(`/api/checkins/stats?childId=${currentChild.id}`)
      const data = await res.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (err) {
      console.error("加载打卡统计失败:", err)
    }
  }, [currentChild])

  // 初始化
  useEffect(() => {
    loadTodayTasks()
    loadStats()
  }, [loadTodayTasks, loadStats])

  // 完成任务（API 调用已移至 store）
  const handleComplete = useCallback(
    async (_taskId: string): Promise<{ points: number; encouragement: string }> => {
      const result = await completeCurrent()
      if (!result) throw new Error("没有可完成的任务")
      // 刷新统计
      loadStats()
      return {
        points: result.pointsEarned,
        encouragement: result.encouragement,
      }
    },
    [completeCurrent, loadStats]
  )

  // 跳过任务（API 调用已移至 store）
  const handleSkip = useCallback(
    async (_taskId: string): Promise<void> => {
      await skipCurrent()
    },
    [skipCurrent]
  )

  // 获取日历数据
  const fetchCalendarMonth = useCallback(
    async (month: string): Promise<DayStatus[]> => {
      if (!currentChild) return []
      const res = await fetch(
        `/api/checkins/calendar?childId=${currentChild.id}&month=${month}`
      )
      const data = await res.json()
      return data.success ? data.data : []
    },
    [currentChild]
  )

  // 未选择孩子
  if (!currentChild) {
    return (
      <div className="px-4 py-6 max-w-lg md:max-w-2xl mx-auto">
        <h1 className="text-xl md:text-2xl font-bold mb-4">训练计划</h1>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm text-center">
          <Target size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-400 dark:text-gray-500 text-sm">请先添加孩子信息</p>
        </div>
      </div>
    )
  }

  if (error && !loading) {
    return (
      <div className="px-4 py-6 max-w-lg md:max-w-2xl mx-auto">
        <h1 className="text-xl md:text-2xl font-bold mb-4">训练计划</h1>
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm text-center">
          <p className="text-gray-500 dark:text-gray-400">数据加载失败，请刷新页面重试</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 max-w-lg md:max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl md:text-2xl font-bold">训练计划</h1>

      {/* ==================== 三阶段概览 ==================== */}
      <div className="space-y-3">
        {PHASES.map(p => {
          const isActive = p.value === currentPhase
          return (
            <div
              key={p.value}
              className={cn(
                "p-4 rounded-xl bg-white dark:bg-gray-900 shadow-sm border-l-4 transition-all",
                isActive ? "border-l-current scale-[1.01]" : "border-l-gray-200"
              )}
              style={isActive ? { borderLeftColor: p.color } : undefined}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{p.phase}</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{p.time}</p>
                </div>
                {isActive && (
                  <span
                    className="text-xs px-2 py-1 rounded-full font-medium"
                    style={{
                      backgroundColor: `${p.color}15`,
                      color: p.color,
                    }}
                  >
                    当前阶段
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{p.goal}</p>
            </div>
          )
        })}
      </div>

      {/* ==================== 今日任务（单任务模式） ==================== */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <Target size={14} />
            今日任务
          </h2>
          {summary.total > 0 && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {summary.completed + summary.skipped}/{summary.total}
            </span>
          )}
        </div>

        {loading ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm text-center">
            <div className="w-8 h-8 border-2 border-[#4CAF50] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-3">加载中...</p>
          </div>
        ) : allDone ? (
          <AllDoneSummary summary={summary} />
        ) : currentTask ? (
          <TaskCard
            id={currentTask.id}
            title={currentTask.title}
            description={currentTask.description}
            taskType={currentTask.taskType}
            duration={currentTask.duration}
            onComplete={handleComplete}
            onSkip={handleSkip}
          />
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm text-center">
            <Star size={48} className="mx-auto text-gray-200 dark:text-gray-700 mb-3" />
            <p className="text-gray-400 dark:text-gray-500 text-sm">完成首次评估后，将为你生成训练计划</p>
          </div>
        )}
      </section>

      {/* ==================== 本周打卡统计 ==================== */}
      {stats && (
        <section>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1">
            <TrendingUp size={14} />
            本周统计
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              icon={<Flame size={20} className="text-[#FF9800]" />}
              value={stats.streakDays}
              label="连续打卡"
              suffix="天"
            />
            <StatCard
              icon={<Trophy size={20} className="text-[#4CAF50]" />}
              value={stats.monthRate}
              label="本月完成率"
              suffix="%"
            />
            <StatCard
              icon={<Calendar size={20} className="text-[#2196F3]" />}
              value={stats.weekStats.completed}
              label="本周完成"
              suffix={`/${stats.weekStats.total}`}
            />
          </div>
        </section>
      )}

      {/* ==================== 打卡日历 ==================== */}
      <section>
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1">
          <Calendar size={14} />
          打卡日历
        </h2>
        <CalendarHeatmap fetchMonth={fetchCalendarMonth} />
      </section>
    </div>
  )
}

/** 全部完成总结组件 */
function AllDoneSummary({
  summary,
}: {
  summary: { total: number; completed: number; skipped: number }
}) {
  const [encouragement] = useState(() => randomItem([...ENCOURAGEMENTS.allDone]))

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm text-center">
      <div className="w-16 h-16 rounded-full bg-[#4CAF50]/10 flex items-center justify-center mx-auto mb-4">
        <Trophy size={32} className="text-[#4CAF50]" />
      </div>
      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-1">今日任务全部完成！</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{encouragement}</p>

      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="text-center">
          <p className="text-2xl font-bold text-[#4CAF50]">{summary.completed}</p>
          <p className="text-gray-400">已完成</p>
        </div>
        {summary.skipped > 0 && (
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-400 dark:text-gray-500">{summary.skipped}</p>
            <p className="text-gray-400 dark:text-gray-500">已跳过</p>
          </div>
        )}
      </div>
    </div>
  )
}

/** 统计卡片组件 */
function StatCard({
  icon,
  value,
  label,
  suffix,
}: {
  icon: React.ReactNode
  value: number
  label: string
  suffix: string
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-3 shadow-sm text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
        {value}
        <span className="text-xs font-normal text-gray-400 dark:text-gray-500">{suffix}</span>
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
    </div>
  )
}
