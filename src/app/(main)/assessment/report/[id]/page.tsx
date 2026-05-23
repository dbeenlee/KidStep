"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts"
import { ArrowLeft, Share2, TrendingUp, TrendingDown, Lightbulb, Trophy } from "lucide-react"
import { useToast } from "@/hooks/useToast"
import { SkeletonCard } from "@/components/ui/SkeletonCard"
import { DIMENSION_CONFIG, getScoreColor, getScoreLabel } from "@/constants/dimensions"
import { generateRadarData, calculateScore } from "@/lib/scoring"
import { useQuizStore } from "@/stores/useQuizStore"
import type { Dimension, QuizAnswer, AssessmentReport } from "@/types/assessment"

/** 评估数据 */
interface AssessmentData {
  id: string
  childId: string
  dimension: string
  score: number
  answers: QuizAnswer[]
  report: AssessmentReport | null
  createdAt: string
}

/** 页面状态 */
type PageStatus = "loading" | "ready" | "local" | "error"

export default function ReportPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const { success: showSuccess } = useToast()

  const [status, setStatus] = useState<PageStatus>("loading")
  const [assessment, setAssessment] = useState<AssessmentData | null>(null)
  const [radarData, setRadarData] = useState<Array<{ dimension: string; score: number; fullMark: number }>>([])
  const [displayReport, setDisplayReport] = useState<AssessmentReport | null>(null)

  useEffect(() => {
    if (id === "local") {
      loadLocalReport()
    } else {
      fetchAssessment(id)
    }
  }, [id])

  /** 从API获取评估详情 */
  async function fetchAssessment(assessmentId: string) {
    try {
      const res = await fetch(`/api/assessments/${assessmentId}`)
      if (!res.ok) {
        setStatus("error")
        return
      }
      const json = await res.json()
      const data: AssessmentData = json.data
      setAssessment(data)

      // 构建雷达图数据（单维度评估时只显示该维度）
      const scores: Record<string, number> = {}
      scores[data.dimension] = data.score
      setRadarData(generateRadarData(scores))

      // 使用数据库中的报告，或根据答案重新生成
      if (data.report) {
        setDisplayReport(data.report)
      } else {
        // 从store获取题目重新生成报告
        const store = useQuizStore.getState()
        if (store.report) {
          setDisplayReport(store.report)
        }
      }

      setStatus("ready")
    } catch {
      setStatus("error")
    }
  }

  /** 从本地store加载报告（未登录时） */
  function loadLocalReport() {
    const store = useQuizStore.getState()
    if (!store.dimension || store.answers.length === 0) {
      setStatus("error")
      return
    }

    const score = store.score ?? calculateScore(store.answers)

    setAssessment({
      id: "local",
      childId: "",
      dimension: store.dimension,
      score,
      answers: store.answers,
      report: store.report,
      createdAt: new Date().toISOString(),
    })

    // 构建雷达图数据
    const scores: Record<string, number> = {}
    scores[store.dimension] = score
    setRadarData(generateRadarData(scores))

    setDisplayReport(store.report)
    setStatus("ready")
  }

  /** 分享功能 */
  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: "童行 - 能力评估报告",
        text: `我在童行完成了${dimConfig?.label ?? "能力"}评估，得分${assessment?.score}分！`,
        url: window.location.href,
      })
    } else {
      // 复制链接
      navigator.clipboard.writeText(window.location.href)
      showSuccess("链接已复制到剪贴板")
    }
  }

  // 加载中
  if (status === "loading") {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <SkeletonCard hasButton />
      </div>
    )
  }

  // 错误状态
  if (status === "error" || !assessment) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <div className="text-center py-16">
          <p className="text-gray-500 dark:text-gray-400 mb-4">无法加载评估报告</p>
          <button
            onClick={() => router.push("/assessment")}
            className="h-11 px-6 bg-[#4CAF50] text-white rounded-xl font-medium"
          >
            返回评估首页
          </button>
        </div>
      </div>
    )
  }

  const dimConfig = DIMENSION_CONFIG[assessment.dimension as Dimension]
  const scoreColor = getScoreColor(assessment.score)
  const scoreLabel = getScoreLabel(assessment.score)

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push("/assessment")}
          className="p-2 -ml-2 text-gray-600 dark:text-gray-300"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-semibold">评估报告</h1>
        <button onClick={handleShare} className="p-2 -mr-2 text-gray-600 dark:text-gray-300">
          <Share2 size={20} />
        </button>
      </div>

      {/* 总分卡片 */}
      <div
        className="rounded-xl p-6 mb-6 text-center text-white"
        style={{
          background: `linear-gradient(135deg, ${dimConfig?.color ?? "#4CAF50"}, ${dimConfig?.color ?? "#4CAF50"}dd)`,
        }}
      >
        <div className="text-5xl font-bold mb-2">{assessment.score}</div>
        <div className="text-sm opacity-90 mb-1">
          {dimConfig?.icon} {dimConfig?.label ?? "能力"}评估
        </div>
        <div
          className="inline-block text-xs px-3 py-1 rounded-full mt-2"
          style={{
            backgroundColor: "rgba(255,255,255,0.25)",
          }}
        >
          {scoreLabel}
        </div>
        <div className="text-xs opacity-75 mt-3">
          {new Date(assessment.createdAt).toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {/* 雷达图 */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm mb-6">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">能力分布</h2>
        <ResponsiveContainer width="100%" height={200}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{ fontSize: 11, fill: "#6b7280" }}
            />
            <Radar
              dataKey="score"
              stroke={dimConfig?.color ?? "#4CAF50"}
              fill={dimConfig?.color ?? "#4CAF50"}
              fillOpacity={0.2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* 分项得分 */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm mb-6">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">得分详情</h2>
        <div className="flex items-center gap-4">
          {/* 分数环形指示 */}
          <div className="relative w-20 h-20 shrink-0">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle
                cx="40"
                cy="40"
                r="34"
                stroke="#f3f4f6"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="40"
                cy="40"
                r="34"
                stroke={scoreColor}
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${(assessment.score / 100) * 213.6} 213.6`}
              />
            </svg>
            <span
              className="absolute inset-0 flex items-center justify-center text-lg font-bold"
              style={{ color: scoreColor }}
            >
              {assessment.score}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Trophy size={16} style={{ color: scoreColor }} />
              <span className="font-medium" style={{ color: scoreColor }}>
                {scoreLabel}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {assessment.score >= 80
                ? "表现优秀，继续保持！"
                : assessment.score >= 60
                  ? "基础扎实，还有提升空间"
                  : assessment.score >= 40
                    ? "需要加强练习"
                    : "建议重点关注和训练"}
            </p>
          </div>
        </div>
      </div>

      {/* 优势分析 */}
      {displayReport?.strengths && displayReport.strengths.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm mb-4">
          <h2 className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            <TrendingUp size={16} className="text-[#4CAF50]" />
            优势领域
          </h2>
          <div className="space-y-2">
            {displayReport.strengths.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-[#E8F5E9] dark:bg-[#1B5E20]/20 rounded-lg"
              >
                <span className="text-[#4CAF50] font-bold text-sm">{i + 1}</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 待提升项 */}
      {displayReport?.weaknesses && displayReport.weaknesses.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm mb-4">
          <h2 className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            <TrendingDown size={16} className="text-[#FF9800]" />
            待提升领域
          </h2>
          <div className="space-y-2">
            {displayReport.weaknesses.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-[#FFF3E0] dark:bg-[#E65100]/20 rounded-lg"
              >
                <span className="text-[#FF9800] font-bold text-sm">{i + 1}</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 个性化建议 */}
      {displayReport?.suggestions && displayReport.suggestions.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm mb-6">
          <h2 className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
            <Lightbulb size={16} className="text-[#FFD700]" />
            训练建议
          </h2>
          <div className="space-y-3">
            {displayReport.suggestions.map((item, i) => (
              <div key={i} className="flex gap-3">
                <span className="shrink-0 w-6 h-6 bg-[#FFF8E1] dark:bg-[#FF9800]/20 rounded-full flex items-center justify-center text-xs font-bold text-[#FF9800]">
                  {i + 1}
                </span>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 底部操作 */}
      <div className="flex gap-3">
        <button
          onClick={() => router.push("/assessment")}
          className="flex-1 h-11 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 font-medium"
        >
          返回评估首页
        </button>
        <button
          onClick={handleShare}
          className="flex-1 h-11 bg-[#4CAF50] text-white rounded-xl font-medium"
        >
          分享报告
        </button>
      </div>
    </div>
  )
}
