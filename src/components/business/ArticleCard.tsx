"use client"

import { Heart, Eye } from "lucide-react"
import { useRouter } from "next/navigation"

/** 文章分类映射 */
const categoryMap: Record<string, { label: string; color: string }> = {
  CONCEPT: { label: "核心概念", color: "#4CAF50" },
  CHECKLIST: { label: "能力清单", color: "#2196F3" },
  SUBJECT: { label: "学科指导", color: "#FF9800" },
  GUIDE: { label: "家长指南", color: "#9C27B0" },
  FAQ: { label: "常见问题", color: "#F44336" },
}

interface ArticleCardProps {
  id: string
  title: string
  summary?: string | null
  category: string
  views: number
  isFavorited: boolean
  onToggleFavorite?: (articleId: string) => void
}

export default function ArticleCard({
  id,
  title,
  summary,
  category,
  views,
  isFavorited,
  onToggleFavorite,
}: ArticleCardProps) {
  const router = useRouter()
  const cat = categoryMap[category] ?? { label: category, color: "#9E9E9E" }

  return (
    <div
      className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
      onClick={() => router.push(`/knowledge/${id}`)}
    >
      {/* 分类标签 */}
      <span
        className="inline-block text-xs px-2 py-0.5 rounded-full mb-2"
        style={{ backgroundColor: cat.color + "18", color: cat.color }}
      >
        {cat.label}
      </span>

      {/* 标题 */}
      <h3 className="font-medium text-gray-900 dark:text-gray-100 leading-snug">{title}</h3>

      {/* 摘要 - 2行截断 */}
      {summary && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{summary}</p>
      )}

      {/* 底栏：阅读量 + 收藏 */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Eye size={14} />
          <span>{views}</span>
        </div>
        <button
          onClick={e => {
            e.stopPropagation()
            onToggleFavorite?.(id)
          }}
          className="p-1.5 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <Heart
            size={18}
            className={isFavorited ? "text-red-500 fill-red-500" : "text-gray-300 dark:text-gray-600"}
          />
        </button>
      </div>
    </div>
  )
}
