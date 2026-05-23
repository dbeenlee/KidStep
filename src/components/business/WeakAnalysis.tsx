"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, TrendingUp, CheckCircle2 } from "lucide-react"
import { Skeleton } from "@/components/ui/Skeleton"
import { DIMENSION_CONFIG } from "@/constants/dimensions"
import type { Dimension } from "@/types/assessment"

interface WeakAnalysisProps {
  childId: string
}

/** 弱项维度数据 */
interface WeakDimension {
  dimension: Dimension
  score: number
  completionRate: number
  reason: string
}

/** API 响应数据 */
interface AnalysisData {
  weakDimensions: WeakDimension[]
  recommendations: string[]
}

export function WeakAnalysis({ childId }: WeakAnalysisProps) {
  const [data, setData] = useState<AnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function fetchAnalysis() {
      setLoading(true)
      setError(false)
      try {
        const res = await fetch(`/api/tasks/weak-analysis?childId=${childId}`)
        const json = await res.json()
        if (!cancelled && json.success) {
          setData(json.data)
        }
      } catch (err) {
        console.error("加载弱项分析失败:", err)
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchAnalysis()
    return () => { cancelled = true }
  }, [childId])

  // 加载态骨架屏
  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-5 w-24" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    )
  }

  // 错误态静默处理（不影响主流程）
  if (error || !data) {
    return null
  }

  // 无弱项：各项均衡
  if (data.weakDimensions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-[#4CAF50]/10 flex items-center justify-center">
            <CheckCircle2 size={20} className="text-[#4CAF50]" />
          </div>
          <div>
            <h3 className="font-medium text-gray-800 dark:text-gray-200">能力发展均衡</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500">各项指标表现良好</p>
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          各项能力均衡发展，继续保持当前的训练节奏！
        </p>
      </div>
    )
  }

  // 有弱项：展示分析卡片
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle size={16} className="text-[#FF9800]" />
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">弱项分析</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {data.weakDimensions.map(item => (
          <WeakDimensionCard key={item.dimension} data={item} />
        ))}
      </div>

      {/* 推荐建议 */}
      {data.recommendations.length > 0 && (
        <div className="bg-[#FF9800]/5 dark:bg-[#FF9800]/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-[#FF9800]" />
            <span className="text-xs font-medium text-[#FF9800]">改进建议</span>
          </div>
          <ul className="space-y-1">
            {data.recommendations.map((rec, idx) => (
              <li
                key={idx}
                className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed"
              >
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/** 弱项维度卡片 */
function WeakDimensionCard({ data }: { data: WeakDimension }) {
  const config = DIMENSION_CONFIG[data.dimension]

  // 根据分数确定进度条颜色
  const progressColor = data.score < 40
    ? "#F44336"
    : data.score < 60
      ? "#FF9800"
      : "#FFC107"

  return (
    <div
      className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800"
    >
      {/* 维度头部 */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
          style={{ backgroundColor: config.bgColor }}
        >
          {config.icon}
        </span>
        <div>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
            {config.label}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {data.score}分
          </p>
        </div>
      </div>

      {/* 进度条 */}
      <div className="mb-3">
        <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(data.score, 100)}%`,
              backgroundColor: progressColor,
            }}
          />
        </div>
      </div>

      {/* 推荐理由 */}
      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
        {data.reason}
      </p>

      {/* 完成率 */}
      {data.completionRate > 0 && (
        <div className="mt-2 flex items-center gap-1">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            任务完成率
          </span>
          <span
            className="text-xs font-medium"
            style={{ color: config.color }}
          >
            {Math.round(data.completionRate * 100)}%
          </span>
        </div>
      )}
    </div>
  )
}
