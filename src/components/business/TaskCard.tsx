"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Clock,
  Repeat,
  Brain,
  Heart,
  BookOpen,
  SkipForward,
  CheckCircle2,
  PartyPopper,
} from "lucide-react"
import { cn } from "@/lib/utils"

/** 任务类型配置 */
const TASK_TYPE_CONFIG: Record<
  string,
  { icon: typeof Clock; color: string; label: string }
> = {
  HABIT: { icon: Repeat, color: "#4CAF50", label: "习惯" },
  ABILITY: { icon: Brain, color: "#FF9800", label: "能力" },
  BONDING: { icon: Heart, color: "#E91E63", label: "亲子" },
  KNOWLEDGE: { icon: BookOpen, color: "#2196F3", label: "知识" },
}

interface TaskCardProps {
  /** 任务ID */
  id: string
  /** 任务标题 */
  title: string
  /** 任务描述 */
  description: string | null
  /** 任务类型 */
  taskType: string
  /** 预计时长（分钟） */
  duration: number | null
  /** 是否为弱项任务 */
  isWeak?: boolean
  /** 完成回调 */
  onComplete: (taskId: string) => Promise<{ points: number; encouragement: string }>
  /** 跳过回调 */
  onSkip: (taskId: string) => Promise<void>
}

export function TaskCard({
  id,
  title,
  description,
  taskType,
  duration,
  isWeak = false,
  onComplete,
  onSkip,
}: TaskCardProps) {
  const [status, setStatus] = useState<"idle" | "completing" | "skipping" | "done">("idle")
  const [earnedPoints, setEarnedPoints] = useState(0)
  const [encouragement, setEncouragement] = useState("")
  const [showConfetti, setShowConfetti] = useState(false)
  const [floatingPoints, setFloatingPoints] = useState(0)
  const [showFloatingPoints, setShowFloatingPoints] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout>()

  // 组件卸载时清除未完成的定时器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const typeConfig = TASK_TYPE_CONFIG[taskType] ?? TASK_TYPE_CONFIG.HABIT
  const TypeIcon = typeConfig.icon

  // 完成动画结束后的回调
  useEffect(() => {
    if (status === "done") {
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [status])

  const handleComplete = useCallback(async () => {
    setStatus("completing")
    try {
      const result = await onComplete(id)
      setEarnedPoints(result.points)
      setEncouragement(result.encouragement)

      // 显示浮动积分动画
      setFloatingPoints(result.points)
      setShowFloatingPoints(true)

      // 动画结束后切换到完成状态
      timeoutRef.current = setTimeout(() => {
        setShowFloatingPoints(false)
        setStatus("done")
      }, 800)
    } catch {
      setStatus("idle")
    }
  }, [id, onComplete])

  const handleSkip = useCallback(async () => {
    setStatus("skipping")
    try {
      await onSkip(id)
    } finally {
      setStatus("idle")
    }
  }, [id, onSkip])

  // 完成状态展示
  if (status === "done") {
    return (
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm text-center overflow-hidden">
        {/* 撒花效果 */}
        {showConfetti && <ConfettiEffect />}

        <div className="relative z-10">
          <CheckCircle2 size={48} className="mx-auto text-[#4CAF50] mb-3" />
          <p className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-1">任务完成！</p>
          <p className="text-2xl font-bold text-[#FF9800] animate-points mb-2">
            +{earnedPoints}分
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{encouragement}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm overflow-hidden">
      {/* 弱项角标 */}
      {isWeak && (
        <div className="absolute -right-8 top-4 bg-[#FF9800] text-white text-xs font-medium py-1 px-8 rotate-45 shadow-sm z-10">
          针对弱项
        </div>
      )}

      {/* 类型标签 */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white"
          style={{ backgroundColor: typeConfig.color }}
        >
          <TypeIcon size={12} />
          {typeConfig.label}
        </span>
        {duration && (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Clock size={12} />
            {duration}分钟
          </span>
        )}
      </div>

      {/* 任务内容 */}
      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">{description}</p>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          {/* 浮动积分动画 */}
          {showFloatingPoints && (
            <span className="absolute left-1/2 -top-6 -translate-x-1/2 text-sm font-bold text-[#FF9800] animate-points z-10 whitespace-nowrap">
              +{floatingPoints}
            </span>
          )}
          <button
            onClick={handleComplete}
            disabled={status === "completing" || status === "skipping"}
            aria-label="完成任务"
            aria-busy={status === "completing"}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all",
              "bg-[#4CAF50] text-white hover:bg-[#4CAF50]/90 active:scale-[0.98]",
              status === "completing" && "opacity-70"
            )}
          >
            <CheckCircle2 size={18} />
            {status === "completing" ? "完成中..." : "完成任务"}
          </button>
        </div>

        <button
          onClick={handleSkip}
          disabled={status === "completing" || status === "skipping"}
          aria-label="跳过任务"
          className={cn(
            "flex items-center justify-center gap-1 px-4 py-3 rounded-xl text-sm font-medium transition-all",
            "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-[0.98]",
            status === "skipping" && "opacity-70"
          )}
        >
          <SkipForward size={16} />
          跳过
        </button>
      </div>
    </div>
  )
}

/** 撒花动画组件 */
function ConfettiEffect() {
  const colors = ["#4CAF50", "#FF9800", "#2196F3", "#E91E63", "#FFC107"]
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: colors[i % colors.length],
    delay: Math.random() * 0.5,
    size: 4 + Math.random() * 6,
  }))

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute animate-confetti"
          style={{
            left: `${p.x}%`,
            top: "30%",
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
      <PartyPopper
        size={32}
        className="absolute top-4 right-4 text-[#FF9800] animate-bounce"
      />
    </div>
  )
}
