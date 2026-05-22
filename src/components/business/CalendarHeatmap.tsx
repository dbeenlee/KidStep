"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

/** 日历中单日的状态 */
interface DayStatus {
  date: string
  completedCount: number
  totalCount: number
  status: "full" | "partial" | "none" | "noTask"
}

interface CalendarHeatmapProps {
  /** 获取指定月份数据的函数 */
  fetchMonth: (month: string) => Promise<DayStatus[]>
  /** 初始月份 YYYY-MM */
  initialMonth?: string
}

/** 状态对应的颜色 */
const STATUS_COLORS: Record<DayStatus["status"], string> = {
  full: "bg-[#4CAF50] text-white",
  partial: "bg-[#4CAF50]/40 text-[#4CAF50]",
  none: "bg-[#FF9800]/20 text-[#FF9800]",
  noTask: "bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600",
}

/** 星期标题 */
const WEEK_HEADERS = ["日", "一", "二", "三", "四", "五", "六"]

/** 获取当前月份字符串 YYYY-MM */
function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

export function CalendarHeatmap({ fetchMonth, initialMonth }: CalendarHeatmapProps) {
  const defaultMonth = initialMonth ?? getCurrentMonth()

  const [currentMonth, setCurrentMonth] = useState(defaultMonth)
  const [days, setDays] = useState<DayStatus[]>([])
  const [loading, setLoading] = useState(false)

  // 解析当前月份
  const [year, month] = currentMonth.split("-").map(Number)

  // 加载月份数据
  const loadMonth = useCallback(
    async (monthStr: string) => {
      setLoading(true)
      try {
        const data = await fetchMonth(monthStr)
        setDays(data)
      } finally {
        setLoading(false)
      }
    },
    [fetchMonth]
  )

  // 首次加载
  useEffect(() => {
    loadMonth(defaultMonth)
  }, [defaultMonth, loadMonth])

  // 计算日历网格
  const calendarGrid = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1).getDay() // 0=周日
    const daysInMonth = new Date(year, month, 0).getDate()

    // 填充前置空白
    const grid: (DayStatus | null)[] = Array(firstDay).fill(null)

    // 填充日期
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      const dayData = days.find(d => d.date === dateStr)
      grid.push(
        dayData ?? {
          date: dateStr,
          completedCount: 0,
          totalCount: 0,
          status: "noTask",
        }
      )
    }

    return grid
  }, [year, month, days])

  // 切换月份
  const goToMonth = useCallback(
    (direction: -1 | 1) => {
      const date = new Date(year, month - 1 + direction, 1)
      const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      setCurrentMonth(newMonth)
      loadMonth(newMonth)
    },
    [year, month, loadMonth]
  )

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm">
      {/* 月份导航 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => goToMonth(-1)}
          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ChevronLeft size={20} className="text-gray-500 dark:text-gray-400" />
        </button>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {year}年{month}月
        </h3>
        <button
          onClick={() => goToMonth(1)}
          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ChevronRight size={20} className="text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* 星期标题 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEK_HEADERS.map(h => (
          <div key={h} className="text-center text-xs text-gray-400 dark:text-gray-500 py-1">
            {h}
          </div>
        ))}
      </div>

      {/* 日期网格 */}
      <div className="grid grid-cols-7 gap-1">
        {calendarGrid.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="aspect-square" />
          }

          const dayNum = parseInt(day.date.split("-")[2], 10)
          const isToday = day.date === new Date().toISOString().split("T")[0]

          return (
            <div
              key={day.date}
              className={cn(
                "aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all",
                STATUS_COLORS[day.status],
                isToday && "ring-2 ring-[#4CAF50] ring-offset-1",
                loading && "opacity-50"
              )}
              title={
                day.totalCount > 0
                  ? `${day.date}: ${day.completedCount}/${day.totalCount}`
                  : day.date
              }
            >
              <span className={cn("font-medium", isToday && "font-bold")}>
                {dayNum}
              </span>
              {day.totalCount > 0 && (
                <span className="text-[10px] leading-none mt-0.5">
                  {day.completedCount}/{day.totalCount}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* 图例 */}
      <div className="flex items-center justify-center gap-3 mt-4 text-xs text-gray-400 dark:text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-[#4CAF50]" />
          全完成
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-[#4CAF50]/40" />
          部分
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-[#FF9800]/20" />
          未完成
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-gray-100 dark:bg-gray-800" />
          无任务
        </div>
      </div>
    </div>
  )
}
