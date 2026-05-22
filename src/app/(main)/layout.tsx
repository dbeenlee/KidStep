"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, BookOpen, BarChart3, ClipboardList, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/useMediaQuery"

const tabs = [
  { href: "/home", icon: Home, label: "首页" },
  { href: "/knowledge", icon: BookOpen, label: "知识" },
  { href: "/assessment", icon: BarChart3, label: "评估" },
  { href: "/plan", icon: ClipboardList, label: "计划" },
  { href: "/profile", icon: User, label: "我的" },
]

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isDesktop = useMediaQuery("(min-width: 1024px)")

  // iPad横屏/桌面端：侧边栏布局
  if (isDesktop) {
    return (
      <div className="flex min-h-screen">
        {/* 侧边栏导航 */}
        <aside className="fixed left-0 top-0 bottom-0 w-56 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col z-40">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <h1 className="text-xl font-bold text-[#4CAF50]">童行</h1>
            <p className="text-xs text-gray-400 mt-0.5">每一步，都陪你走</p>
          </div>
          <nav className="flex-1 py-4">
            {tabs.map(tab => {
              const isActive = pathname.startsWith(tab.href)
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    "flex items-center gap-3 px-6 py-3 transition-colors",
                    isActive
                      ? "text-[#4CAF50] bg-[#4CAF50]/5 border-r-2 border-[#4CAF50]"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                >
                  <tab.icon size={20} />
                  <span className="text-sm font-medium">{tab.label}</span>
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 ml-56">
          <div className="max-w-4xl mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    )
  }

  // 手机竖屏：底部导航栏布局
  return (
    <div className="flex flex-col min-h-screen">
      {/* 页面内容 */}
      <main className="flex-1 pb-20">{children}</main>

      {/* 底部导航栏 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 safe-pb z-40">
        <div className="flex items-center justify-around max-w-lg mx-auto h-16">
          {tabs.map(tab => {
            const isActive = pathname.startsWith(tab.href)
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 w-16 h-full touch-target",
                  isActive ? "text-[#4CAF50]" : "text-gray-400 dark:text-gray-500"
                )}
              >
                <tab.icon size={22} />
                <span className="text-xs">{tab.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
