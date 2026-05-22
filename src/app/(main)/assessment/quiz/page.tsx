"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, SkipForward, CheckCircle } from "lucide-react"
import { QUESTIONS, getQuestionsByDimension } from "@/constants/questions"
import { DIMENSION_CONFIG } from "@/constants/dimensions"
import { calculateScore, generateReport } from "@/lib/scoring"
import { useQuizStore } from "@/stores/useQuizStore"
import type { Dimension, Question, QuizAnswer } from "@/types/assessment"

/** 页面状态 */
type PageStatus = "loading" | "ready" | "submitting" | "error"

export default function QuizPage() {
  return (
    <Suspense fallback={<div className="px-4 py-6 max-w-lg mx-auto"><p className="text-gray-400 dark:text-gray-500 text-center py-16">加载中...</p></div>}>
      <QuizContent />
    </Suspense>
  )
}

function QuizContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dimension = searchParams.get("dimension") ?? "all"

  const [status, setStatus] = useState<PageStatus>("loading")
  const [questions, setQuestions] = useState<Question[]>([])
  const [showTips, setShowTips] = useState(false)
  const [lastAnsweredIndex, setLastAnsweredIndex] = useState<number | null>(null)

  const {
    phase,
    currentIndex,
    totalQuestions,
    answers,
    startQuiz,
    selectAnswer,
    goBack,
    skipQuestion,
    submit,
  } = useQuizStore()

  // 加载题目并初始化
  useEffect(() => {
    const loadedQuestions: Question[] =
      dimension === "all" ? QUESTIONS : getQuestionsByDimension(dimension)

    if (loadedQuestions.length === 0) {
      setStatus("error")
      return
    }

    setQuestions(loadedQuestions)

    // 如果store处于idle状态（首次进入或刷新），初始化
    if (phase === "idle") {
      startQuiz(dimension, loadedQuestions.length)
    }

    setStatus("ready")
  }, [dimension, phase, startQuiz])

  // 选择答案后显示贴士
  const handleSelect = useCallback(
    (optionKey: string, question: Question, index: number) => {
      const selectedOption = question.options.find(o => o.key === optionKey)
      if (!selectedOption) return

      const answer: QuizAnswer = {
        questionId: question.id,
        optionKey,
        score: selectedOption.score,
      }

      // 记录当前题目索引用于显示贴士（selectAnswer会自动推进到下一题）
      setLastAnsweredIndex(index)
      selectAnswer(answer)
      setShowTips(true)
    },
    [selectAnswer]
  )

  // 进入下一题（清除贴士）
  const handleNext = useCallback(() => {
    setShowTips(false)
    setLastAnsweredIndex(null)
  }, [])

  // 上一题
  const handlePrev = useCallback(() => {
    setShowTips(false)
    setLastAnsweredIndex(null)
    goBack()
  }, [goBack])

  // 跳过
  const handleSkip = useCallback(() => {
    setShowTips(false)
    setLastAnsweredIndex(null)
    skipQuestion()
  }, [skipQuestion])

  // 提交评估
  const handleSubmit = useCallback(async () => {
    setStatus("submitting")

    try {
      const score = calculateScore(answers)
      const report = generateReport(answers, questions)

      // 保存到本地store
      submit(score, report)

      // 提交到API
      // 注意：实际使用时需要获取当前孩子的childId
      // 这里先从localStorage获取（由评估首页设置）
      const childId = localStorage.getItem("currentChildId")
      if (!childId) {
        // 没有childId时跳转到报告页（本地模式）
        router.push(`/assessment/report/local`)
        return
      }

      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId,
          dimension,
          answers,
        }),
      })

      if (res.ok) {
        const json = await res.json()
        const assessmentId = json.data.id as string
        router.push(`/assessment/report/${assessmentId}`)
      } else {
        // API失败时也跳转到本地报告
        router.push(`/assessment/report/local`)
      }
    } catch {
      router.push(`/assessment/report/local`)
    }
  }, [answers, questions, dimension, submit, router])

  // 加载中
  if (status === "loading" || questions.length === 0) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <p className="text-gray-400 text-center py-16">加载中...</p>
      </div>
    )
  }

  // 错误状态
  if (status === "error") {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <div className="text-center py-16">
          <p className="text-gray-500 dark:text-gray-400 mb-4">未找到该维度的题目</p>
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

  // 已完成
  if (phase === "completed") {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <div className="text-center py-16">
          <CheckCircle size={64} className="mx-auto text-[#4CAF50] mb-4" />
          <h2 className="text-xl font-bold mb-2">答题完成</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            共{totalQuestions}题，已全部作答
          </p>
          <div className="space-y-3">
            <button
              onClick={handleSubmit}
              disabled={status === "submitting"}
              className="w-full h-11 bg-[#4CAF50] text-white rounded-xl font-medium disabled:opacity-50"
            >
              {status === "submitting" ? "正在生成报告..." : "查看结果"}
            </button>
            <button
              onClick={() => {
                useQuizStore.getState().reset()
                router.push("/assessment")
              }}
              className="w-full h-11 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl"
            >
              返回评估首页
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 答题中
  const question = questions[currentIndex]
  if (!question) return null

  const dimConfig = DIMENSION_CONFIG[question.dimension as Dimension]
  const progress = ((currentIndex + 1) / questions.length) * 100
  const isLastQuestion = currentIndex === questions.length - 1

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="p-2 -ml-2 text-gray-400 disabled:opacity-30"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={() => {
            useQuizStore.getState().reset()
            router.push("/assessment")
          }}
          className="text-sm text-gray-400"
        >
          退出
        </button>
      </div>

      {/* 进度条 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {currentIndex + 1} / {questions.length}
          </span>
          <span
            className="text-xs px-2 py-1 rounded-full"
            style={{
              backgroundColor: dimConfig.color + "20",
              color: dimConfig.color,
            }}
          >
            {dimConfig.icon} {dimConfig.label}
          </span>
        </div>
        <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#4CAF50] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 题目 */}
      <h2 className="text-lg font-semibold mb-6">{question.question}</h2>

      {/* 选项 */}
      <div className="space-y-3 mb-6">
        {question.options.map(opt => {
          const isSelected = answers[currentIndex]?.optionKey === opt.key
          return (
            <button
              key={opt.key}
              onClick={() => handleSelect(opt.key, question, currentIndex)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                isSelected
                  ? "border-[#4CAF50] bg-[#4CAF50]/10"
                  : "border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 active:border-gray-300 dark:active:border-gray-600"
              }`}
            >
              <span className="font-medium mr-2">{opt.key}.</span>
              {opt.text}
            </button>
          )
        })}
      </div>

      {/* 贴士（显示上一题的贴士，因为selectAnswer已自动推进索引） */}
      {showTips && lastAnsweredIndex !== null && questions[lastAnsweredIndex]?.tips && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-xl text-sm text-yellow-800 dark:text-yellow-200">
          {questions[lastAnsweredIndex].tips}
        </div>
      )}

      {/* 底部按钮 */}
      <div className="flex gap-3">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="flex-1 h-11 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 disabled:opacity-30"
        >
          上一题
        </button>

        {!isLastQuestion && (
          <button
            onClick={handleSkip}
            className="h-11 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400"
          >
            <SkipForward size={18} />
          </button>
        )}

        {answers[currentIndex] && !isLastQuestion && (
          <button
            onClick={handleNext}
            className="flex-1 h-11 bg-[#4CAF50] text-white rounded-xl font-medium"
          >
            下一题
          </button>
        )}
      </div>
    </div>
  )
}
