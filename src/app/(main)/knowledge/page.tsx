"use client"

import { useEffect, useState, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Search, X } from "lucide-react"
import { useToast } from "@/hooks/useToast"
import ArticleCard from "@/components/business/ArticleCard"
import { SkeletonList } from "@/components/ui/SkeletonList"

/** 文章分类定义 */
const categories = [
  { key: "", label: "全部" },
  { key: "CONCEPT", label: "核心概念" },
  { key: "CHECKLIST", label: "能力清单" },
  { key: "SUBJECT", label: "学科指导" },
  { key: "GUIDE", label: "家长指南" },
  { key: "FAQ", label: "常见问题" },
]

interface ArticleItem {
  id: string
  category: string
  title: string
  summary: string | null
  coverUrl: string | null
  tags: string | null
  views: number
  likes: number
  createdAt: string
}

export default function KnowledgePage() {
  return (
    <Suspense fallback={<div className="px-4 py-6 max-w-lg mx-auto"><SkeletonList count={4} /></div>}>
      <KnowledgeContent />
    </Suspense>
  )
}

function KnowledgeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const { error: showError } = useToast()

  const [articles, setArticles] = useState<ArticleItem[]>([])
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") ?? "")
  const activeCategory = searchParams.get("category") ?? ""

  /** 获取文章列表 */
  const fetchArticles = useCallback(async (category: string, q: string) => {
    setLoading(true)
    try {
      let url: string
      if (q) {
        url = `/api/articles/search?q=${encodeURIComponent(q)}`
      } else if (category) {
        url = `/api/articles?category=${category}`
      } else {
        url = `/api/articles`
      }

      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setArticles(data.data.items)
      }
    } catch (err) {
      console.error("加载文章列表失败:", err)
      showError("加载文章失败，请稍后重试")
    } finally {
      setLoading(false)
    }
  }, [showError])

  /** 获取收藏列表 */
  const fetchFavorites = useCallback(async () => {
    try {
      const res = await fetch("/api/favorites")
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setFavoriteIds(new Set(data.data.map((a: ArticleItem) => a.id)))
        }
      }
    } catch {
      // 未登录时静默失败
    }
  }, [])

  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  useEffect(() => {
    fetchArticles(activeCategory, searchParams.get("q") ?? "")
  }, [activeCategory, searchParams, fetchArticles])

  /** 切换分类 */
  const handleCategoryChange = (key: string) => {
    const params = new URLSearchParams()
    if (key) params.set("category", key)
    if (searchQuery) params.set("q", searchQuery)
    router.push(`/knowledge${params.toString() ? "?" + params.toString() : ""}`)
  }

  /** 搜索 */
  const handleSearch = () => {
    const params = new URLSearchParams()
    if (activeCategory) params.set("category", activeCategory)
    if (searchQuery.trim()) params.set("q", searchQuery.trim())
    router.push(`/knowledge${params.toString() ? "?" + params.toString() : ""}`)
  }

  /** 清除搜索 */
  const clearSearch = () => {
    setSearchQuery("")
    const params = new URLSearchParams()
    if (activeCategory) params.set("category", activeCategory)
    router.push(`/knowledge${params.toString() ? "?" + params.toString() : ""}`)
  }

  /** 切换收藏 */
  const handleToggleFavorite = async (articleId: string) => {
    const isFav = favoriteIds.has(articleId)
    try {
      if (isFav) {
        await fetch(`/api/favorites?id=${articleId}`, { method: "DELETE" })
        setFavoriteIds(prev => {
          const next = new Set(prev)
          next.delete(articleId)
          return next
        })
      } else {
        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ articleId }),
        })
        setFavoriteIds(prev => new Set(prev).add(articleId))
      }
    } catch (err) {
      console.error("切换收藏失败:", err)
      showError("操作失败，请稍后重试")
    }
  }

  return (
    <div className="px-4 py-6 max-w-lg md:max-w-2xl mx-auto">
      {/* 标题 */}
      <h1 className="text-xl md:text-2xl font-bold mb-4">知识中心</h1>

      {/* 搜索框 */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
          placeholder="搜索文章..."
          className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4CAF50]/30 transition-shadow bg-transparent"
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 touch-target"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* 分类标签导航 */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => handleCategoryChange(cat.key)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm transition-colors touch-target ${
              activeCategory === cat.key
                ? "bg-[#4CAF50] text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 文章列表 - iPad双列 */}
      {loading ? (
        <SkeletonList count={4} />
      ) : articles.length === 0 ? (
        <div className="text-center text-gray-400 dark:text-gray-500 py-16">
          {searchQuery ? "未找到相关文章" : "暂无文章"}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {articles.map(article => (
            <ArticleCard
              key={article.id}
              id={article.id}
              title={article.title}
              summary={article.summary}
              category={article.category}
              views={article.views}
              isFavorited={favoriteIds.has(article.id)}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  )
}
