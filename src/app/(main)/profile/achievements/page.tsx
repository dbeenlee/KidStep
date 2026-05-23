"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import {
  ChevronLeft,
  ClipboardCheck,
  LayoutGrid,
  Trophy,
  Footprints,
  Flame,
  Calendar,
  Crown,
  Flag,
  Rocket,
  Target,
  Medal,
  Zap,
  Shield,
  Layers,
  Star,
  Gem,
  BookOpen,
  Library,
  GraduationCap,
  Heart,
  Lock,
  type LucideIcon,
} from "lucide-react"
import { useChildStore } from "@/stores/useChildStore"
import { useToast } from "@/hooks/useToast"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import type { AchievementCategory } from "@/constants/achievements"

/** 图标映射表 */
const ICON_MAP: Record<string, LucideIcon> = {
  ClipboardCheck,
  LayoutGrid,
  Trophy,
  Footprints,
  Flame,
  Calendar,
  Crown,
  Flag,
  Rocket,
  Target,
  Medal,
  Zap,
  Shield,
  Layers,
  Star,
  Gem,
  BookOpen,
  Library,
  GraduationCap,
  Heart,
}

/** 分类 Tab 配置 */
interface CategoryTab {
  key: AchievementCategory | "ALL"
  label: string
}

const CATEGORY_TABS: CategoryTab[] = [
  { key: "ALL", label: "全部" },
  { key: "ASSESSMENT", label: "评估" },
  { key: "CHECKIN", label: "打卡" },
  { key: "TASK", label: "任务" },
  { key: "KNOWLEDGE", label: "知识" },
]

/** 成就数据结构 */
interface AchievementItem {
  code: string
  title: string
  description: string
  icon: string
  category: AchievementCategory
  condition: { type: string; value?: number }
  unlocked: boolean
  unlockedAt?: string
}

/** 格式化日期 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

/** 获取图标组件 */
function getIcon(iconName: string): LucideIcon {
  return ICON_MAP[iconName] ?? Star
}

export default function AchievementsPage() {
  const { currentChild } = useChildStore()
  const { error: showError } = useToast()

  const [achievements, setAchievements] = useState<AchievementItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<AchievementCategory | "ALL">("ALL")

  /** 加载成就数据 */
  const loadAchievements = useCallback(async () => {
    if (!currentChild) return
    setLoading(true)
    try {
      const res = await fetch(`/api/achievements?childId=${currentChild.id}`)
      const data = await res.json()
      if (data.success) {
        setAchievements(data.data.achievements)
      }
    } catch (err) {
      console.error("加载成就失败:", err)
      showError("加载成就数据失败，请稍后重试")
    } finally {
      setLoading(false)
    }
  }, [currentChild, showError])

  useEffect(() => {
    loadAchievements()
  }, [loadAchievements])

  /** 筛选当前 Tab 的成就 */
  const filteredAchievements =
    activeTab === "ALL"
      ? achievements
      : achievements.filter((a) => a.category === activeTab)

  /** 统计已解锁数量 */
  const unlockedCount = achievements.filter((a) => a.unlocked).length
  const totalCount = achievements.length

  if (!currentChild) {
    return (
      <div className="px-4 py-6 max-w-lg md:max-w-2xl mx-auto">
        <header className="flex items-center gap-3 mb-6">
          <Link
            href="/profile"
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="返回个人中心"
          >
            <ChevronLeft size={20} />
          </Link>
          <h1 className="text-xl md:text-2xl font-bold">成就徽章</h1>
        </header>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">请先添加孩子信息</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 max-w-lg md:max-w-2xl mx-auto">
      {/* 页面标题 */}
      <header className="flex items-center gap-3 mb-6">
        <Link
          href="/profile"
          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="返回个人中心"
        >
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-xl md:text-2xl font-bold">成就徽章</h1>
      </header>

      {/* 统计卡片 */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 mb-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">已解锁</p>
            <p className="text-2xl font-bold text-[#4CAF50]">
              {unlockedCount}
              <span className="text-sm font-normal text-gray-400 dark:text-gray-500">
                /{totalCount}
              </span>
            </p>
          </div>
          {/* 进度环 */}
          <div
            className="relative w-16 h-16"
            role="progressbar"
            aria-valuenow={unlockedCount}
            aria-valuemin={0}
            aria-valuemax={totalCount}
            aria-label={`成就进度 ${unlockedCount}/${totalCount}`}
          >
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-gray-100 dark:text-gray-800"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="#4CAF50"
                strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - unlockedCount / totalCount)}`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-[#4CAF50]">
              {totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* 分类 Tab */}
      <nav
        className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-4 overflow-x-auto"
        role="tablist"
        aria-label="成就分类"
      >
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 min-w-[60px] px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-white dark:bg-gray-700 text-[#4CAF50] shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* 成就列表 */}
      {loading ? (
        <LoadingSpinner showText />
      ) : filteredAchievements.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">暂无成就</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3" role="list">
          {filteredAchievements.map((achievement) => {
            const IconComponent = getIcon(achievement.icon)
            const isUnlocked = achievement.unlocked

            return (
              <div
                key={achievement.code}
                role="listitem"
                className={`relative bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm transition-all ${
                  isUnlocked
                    ? "ring-2 ring-[#4CAF50]/30"
                    : "opacity-60 grayscale"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* 图标 */}
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isUnlocked
                        ? "bg-[#4CAF50]/10 text-[#4CAF50]"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    {isUnlocked ? (
                      <IconComponent size={24} />
                    ) : (
                      <Lock size={24} />
                    )}
                  </div>

                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-0.5">{achievement.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {achievement.description}
                    </p>
                    {isUnlocked && achievement.unlockedAt ? (
                      <p className="text-xs text-[#4CAF50]">
                        解锁于 {formatDate(achievement.unlockedAt)}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        未解锁
                      </p>
                    )}
                  </div>
                </div>

                {/* 已解锁标记 */}
                {isUnlocked && (
                  <div className="absolute top-2 right-2">
                    <div className="w-5 h-5 bg-[#4CAF50] rounded-full flex items-center justify-center">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M2 6L5 9L10 3"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
