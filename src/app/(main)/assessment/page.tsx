"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts"
import { BarChart3, ChevronRight, Zap } from "lucide-react"
import { DIMENSION_CONFIG, getScoreColor, getScoreLabel } from "@/constants/dimensions"
import { generateRadarData } from "@/lib/scoring"
import type { Dimension } from "@/types/assessment"

/** 孩子信息 */
interface ChildInfo {
  id: string
  name: string
}

/** 评估记录（API 返回格式） */
interface AssessmentItem {
  id: string
  childId: string
  dimension: string
  score: number
  answers: string
  report: string | null
  createdAt: string
}

/** 页面状态 */
type PageStatus = "loading" | "noChild" | "ready"

export default function AssessmentPage() {
  const [status, setStatus] = useState<PageStatus>("loading")
  const [childrenList, setChildrenList] = useState<ChildInfo[]>([])
  const [selectedChildId, setSelectedChildId] = useState<string>("")
  const [assessments, setAssessments] = useState<AssessmentItem[]>([])
  const [radarData, setRadarData] = useState<Array<{ dimension: string; score: number; fullMark: number }>>([])
  const [dimensionScores, setDimensionScores] = useState<Record<string, number>>({})

  // 获取孩子列表和评估数据
  useEffect(() => {
    async function fetchData() {
      try {
        const childRes = await fetch("/api/children")
        if (!childRes.ok) {
          setStatus("noChild")
          return
        }
        const childJson = await childRes.json()
        const kids: ChildInfo[] = childJson.data ?? []
        if (kids.length === 0) {
          setStatus("noChild")
          return
        }

        setChildrenList(kids)
        const firstChildId = kids[0].id
        setSelectedChildId(firstChildId)
        localStorage.setItem("currentChildId", firstChildId)

        // 获取该孩子的评估记录
        await fetchAssessments(firstChildId)
        setStatus("ready")
      } catch {
        setStatus("noChild")
      }
    }
    fetchData()
  }, [])

  // 切换孩子时重新加载评估
  useEffect(() => {
    if (selectedChildId) {
      fetchAssessments(selectedChildId)
    }
  }, [selectedChildId])

  /** 获取评估记录并计算各维度最新分数 */
  async function fetchAssessments(childId: string) {
    try {
      const res = await fetch(`/api/assessments?childId=${childId}`)
      if (!res.ok) return
      const json = await res.json()
      const items: AssessmentItem[] = json.data ?? []
      setAssessments(items)

      // 每个维度取最新分数
      const latestScores: Record<string, number> = {}
      for (const dim of Object.keys(DIMENSION_CONFIG)) {
        const latest = items.find(a => a.dimension === dim)
        if (latest) latestScores[dim] = latest.score
      }
      setDimensionScores(latestScores)
      setRadarData(generateRadarData(latestScores))
    } catch {
      // 静默失败
    }
  }

  // 加载中
  if (status === "loading") {
    return (
      <div className="px-4 py-6 max-w-lg md:max-w-2xl mx-auto">
        <p className="text-gray-400 text-center py-16">加载中...</p>
      </div>
    )
  }

  // 未添加孩子
  if (status === "noChild") {
    return (
      <div className="px-4 py-6 max-w-lg md:max-w-2xl mx-auto">
        <h1 className="text-xl md:text-2xl font-bold mb-6">
          <BarChart3 size={20} className="inline mr-2 text-[#4CAF50]" />
          能力评估
        </h1>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-sm text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">请先添加孩子信息</p>
          <Link
            href="/profile/children"
            className="inline-block h-11 leading-11 px-6 bg-[#4CAF50] text-white rounded-xl font-medium"
          >
            去添加孩子
          </Link>
        </div>
      </div>
    )
  }

  const hasRadarData = radarData.some(d => d.score > 0)

  return (
    <div className="px-4 py-6 max-w-lg md:max-w-2xl mx-auto">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold">
          <BarChart3 size={20} className="inline mr-2 text-[#4CAF50]" />
          能力评估
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">了解孩子的成长状态，科学衔接小学</p>
      </div>

      {/* 孩子选择器（多个孩子时显示） */}
      {childrenList.length > 1 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {childrenList.map(child => (
            <button
              key={child.id}
              onClick={() => {
                setSelectedChildId(child.id)
                localStorage.setItem("currentChildId", child.id)
              }}
              className={`shrink-0 px-4 py-2 rounded-full text-sm transition-colors ${
                selectedChildId === child.id
                  ? "bg-[#4CAF50] text-white"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300"
              }`}
            >
              {child.name}
            </button>
          ))}
        </div>
      )}

      {/* 雷达图 */}
      {hasRadarData && (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm mb-6">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">能力雷达图</h2>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis
                dataKey="dimension"
                tick={{ fontSize: 12, fill: "#6b7280" }}
              />
              <Radar
                dataKey="score"
                stroke="#4CAF50"
                fill="#4CAF50"
                fillOpacity={0.25}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 四维度入口 */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm mb-6">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">选择评估维度</h2>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {(Object.entries(DIMENSION_CONFIG) as Array<[Dimension, typeof DIMENSION_CONFIG[Dimension]]>).map(
            ([key, config]) => {
              const score = dimensionScores[key]
              const hasScore = score !== undefined
              return (
                <Link
                  key={key}
                  href={`/assessment/quiz?dimension=${key}`}
                  className="flex flex-col gap-2 p-4 rounded-xl border border-gray-100 dark:border-gray-800 active:scale-95 transition-transform"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{config.icon}</span>
                    {hasScore && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: getScoreColor(score) + "20",
                          color: getScoreColor(score),
                        }}
                      >
                        {getScoreLabel(score)}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium">{config.label}</span>
                  {hasScore && (
                    <span className="text-xs text-gray-400">{score}分</span>
                  )}
                </Link>
              )
            }
          )}
        </div>

        {/* 全部评估按钮 */}
        <Link
          href="/assessment/quiz?dimension=all"
          className="flex items-center justify-center gap-2 w-full h-11 bg-[#4CAF50] text-white rounded-xl font-medium active:scale-[0.98] transition-transform"
        >
          <Zap size={18} />
          开始全部评估
        </Link>
      </div>

      {/* 历史记录 */}
      <section>
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">历史记录</h2>
        {assessments.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-sm text-center">
            <p className="text-gray-400 dark:text-gray-500 text-sm">暂无评估记录</p>
            <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">完成首次评估后，记录将显示在这里</p>
          </div>
        ) : (
          <div className="space-y-2">
            {assessments.map(item => {
              const dimConfig = DIMENSION_CONFIG[item.dimension as Dimension]
              if (!dimConfig) return null
              return (
                <Link
                  key={item.id}
                  href={`/assessment/report/${item.id}`}
                  className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-xl shadow-sm active:bg-gray-50 dark:active:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                      style={{ backgroundColor: dimConfig.bgColor }}
                    >
                      {dimConfig.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{dimConfig.label}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(item.createdAt).toLocaleDateString("zh-CN")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-lg font-bold"
                      style={{ color: getScoreColor(item.score) }}
                    >
                      {item.score}
                    </span>
                    <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
