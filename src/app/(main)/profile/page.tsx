"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ChevronRight,
  Baby,
  FolderOpen,
  Star,
  Award,
  Settings,
  Users,
} from "lucide-react"
import { useChildStore } from "@/stores/useChildStore"
import { PointsBadge } from "@/components/business/PointsBadge"
import dayjs from "dayjs"

/** 菜单项配置 */
const menuItems = [
  { icon: Baby, label: "孩子管理", href: "/profile/children" },
  { icon: FolderOpen, label: "成长档案", href: "/profile/archive" },
  { icon: Star, label: "我的收藏", href: "/profile/favorites" },
  { icon: Award, label: "积分记录", href: "/profile/points" },
  { icon: Award, label: "成就徽章", href: "/profile/achievements" },
  { icon: Users, label: "家庭成员", href: "/profile/family" },
  { icon: Settings, label: "设置", href: "/profile/settings" },
]

/** 计算年龄显示文本 */
function getAgeText(birthday: string): string {
  const birth = dayjs(birthday)
  const now = dayjs()
  const years = now.diff(birth, "year")
  const months = now.diff(birth, "month") % 12
  if (years === 0) {
    return `${months}个月`
  }
  return months > 0 ? `${years}岁${months}个月` : `${years}岁`
}

export default function ProfilePage() {
  const { currentChild, children, setChildren } = useChildStore()
  const [totalPoints, setTotalPoints] = useState(0)
  const [error, setError] = useState(false)

  /** 加载孩子列表 */
  useEffect(() => {
    async function loadChildren() {
      try {
        const res = await fetch("/api/children")
        const data = await res.json()
        if (data.success) {
          setChildren(data.data)
        }
      } catch (err) {
        console.error("加载孩子列表失败:", err)
        setError(true)
      }
    }
    loadChildren()
  }, [setChildren])

  /** 加载积分 */
  useEffect(() => {
    async function loadPoints() {
      if (!currentChild) return
      try {
        const res = await fetch(`/api/points?childId=${currentChild.id}`)
        const data = await res.json()
        if (data.success) {
          setTotalPoints(data.data.totalPoints ?? 0)
        }
      } catch {
        // 静默处理
      }
    }
    loadPoints()
  }, [currentChild?.id])

  if (error) {
    return (
      <div className="px-4 py-6 max-w-lg md:max-w-2xl mx-auto">
        <h1 className="text-xl md:text-2xl font-bold mb-6">我的</h1>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">加载失败，请刷新页面重试</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 max-w-lg md:max-w-2xl mx-auto">
      <h1 className="text-xl md:text-2xl font-bold mb-6">我的</h1>

      {/* iPad横屏：两列布局 */}
      <div className="md:grid md:grid-cols-2 md:gap-6">
        {/* 孩子信息卡片 */}
        <div>
          <Link href="/profile/children">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm mb-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[#4CAF50]/20 rounded-full flex items-center justify-center">
                  <Baby size={28} className="text-[#4CAF50]" />
                </div>
                <div className="flex-1">
                  {currentChild ? (
                    <>
                      <h2 className="font-semibold">{currentChild.name}</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {getAgeText(currentChild.birthday)}
                        {currentChild.targetSchool &&
                          ` · 目标: ${currentChild.targetSchool}`}
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="font-semibold">
                        {children.length > 0 ? "选择孩子" : "未添加孩子"}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {children.length > 0
                          ? "点击切换当前孩子"
                          : "点击添加孩子信息"}
                      </p>
                    </>
                  )}
                </div>
                <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
              </div>
            </div>
          </Link>

          {/* 积分展示 */}
          {currentChild && (
            <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm mb-4 md:mb-0">
              <PointsBadge points={totalPoints} />
            </div>
          )}
        </div>

        {/* 菜单列表 */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden">
          {menuItems.map((item, i) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center justify-between p-4 active:bg-gray-50 dark:active:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors touch-target ${
                i > 0 ? "border-t border-gray-50 dark:border-gray-800" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                  <item.icon size={18} className="text-gray-600 dark:text-gray-300" />
                </div>
                <span className="text-sm">{item.label}</span>
              </div>
              <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
