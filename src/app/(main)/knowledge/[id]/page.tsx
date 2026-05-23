"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Heart, Share2, Eye, ChevronUp } from "lucide-react"
import { marked } from "marked"
import { useToast } from "@/hooks/useToast"
import ArticleCard from "@/components/business/ArticleCard"
import { SkeletonCard } from "@/components/ui/SkeletonCard"

/** 文章分类映射 */
const categoryMap: Record<string, { label: string; color: string }> = {
  CONCEPT: { label: "核心概念", color: "#4CAF50" },
  CHECKLIST: { label: "能力清单", color: "#2196F3" },
  SUBJECT: { label: "学科指导", color: "#FF9800" },
  GUIDE: { label: "家长指南", color: "#9C27B0" },
  FAQ: { label: "常见问题", color: "#F44336" },
}

interface ArticleDetail {
  id: string
  category: string
  title: string
  content: string
  summary: string | null
  coverUrl: string | null
  tags: string | null
  views: number
  likes: number
  createdAt: string
}

interface ArticleItem {
  id: string
  category: string
  title: string
  summary: string | null
  views: number
}

/** 简单的 HTML 消毒：移除 script 标签和事件属性 */
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
}

export default function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { success: showSuccess, error: showError } = useToast()

  const [article, setArticle] = useState<ArticleDetail | null>(null)
  const [relatedArticles, setRelatedArticles] = useState<ArticleItem[]>([])
  const [isFavorited, setIsFavorited] = useState(false)
  const [loading, setLoading] = useState(true)
  const [htmlContent, setHtmlContent] = useState("")

  /** 获取文章详情 */
  const fetchArticle = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/articles/${id}`)
      const data = await res.json()
      if (data.success) {
        setArticle(data.data)
        // 渲染 markdown
        const raw = await marked(data.data.content)
        setHtmlContent(sanitizeHtml(raw as string))
      }
    } catch (err) {
      console.error("加载文章失败:", err)
      showError("加载文章失败，请稍后重试")
    } finally {
      setLoading(false)
    }
  }, [id, showError])

  /** 检查收藏状态 */
  const checkFavorite = useCallback(async () => {
    try {
      const res = await fetch("/api/favorites")
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setIsFavorited(data.data.some((a: ArticleItem) => a.id === id))
        }
      }
    } catch {
      // 未登录时静默失败
    }
  }, [id])

  /** 获取相关推荐（同分类文章） */
  const fetchRelated = useCallback(async (category: string) => {
    try {
      const res = await fetch(`/api/articles?category=${category}&pageSize=3`)
      const data = await res.json()
      if (data.success) {
        setRelatedArticles(data.data.items.filter((a: ArticleItem) => a.id !== id))
      }
    } catch {
      // 静默失败
    }
  }, [id])

  useEffect(() => {
    fetchArticle()
    checkFavorite()
  }, [fetchArticle, checkFavorite])

  useEffect(() => {
    if (article?.category) {
      fetchRelated(article.category)
    }
  }, [article?.category, fetchRelated])

  /** 切换收藏 */
  const handleToggleFavorite = async () => {
    try {
      if (isFavorited) {
        await fetch(`/api/favorites?id=${id}`, { method: "DELETE" })
        setIsFavorited(false)
      } else {
        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ articleId: id }),
        })
        setIsFavorited(true)
      }
    } catch {
      // 静默失败
    }
  }

  /** 分享 */
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article?.title ?? "KidStep 知识文章",
          url: window.location.href,
        })
      } catch {
        // 用户取消
      }
    } else {
      await navigator.clipboard.writeText(window.location.href)
      showSuccess("链接已复制")
    }
  }

  /** 返回顶部 */
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  if (loading) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <SkeletonCard hasButton />
      </div>
    )
  }

  if (!article) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <div className="text-center text-gray-400 py-16">文章不存在</div>
      </div>
    )
  }

  const cat = categoryMap[article.category] ?? { label: article.category, color: "#9E9E9E" }
  const formattedDate = new Date(article.createdAt).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between px-4 h-12 max-w-lg mx-auto">
          <button
            onClick={() => router.back()}
            className="p-1.5 -ml-1.5 text-gray-600 dark:text-gray-300"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">文章详情</span>
          <div className="w-8" />
        </div>
      </div>

      <article className="px-4 py-6 max-w-lg mx-auto">
        {/* 文章头部 */}
        <header className="mb-6">
          {/* 分类标签 */}
          <span
            className="inline-block text-xs px-2 py-0.5 rounded-full mb-3"
            style={{ backgroundColor: cat.color + "18", color: cat.color }}
          >
            {cat.label}
          </span>

          {/* 标题 */}
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight mb-3">
            {article.title}
          </h1>

          {/* 元信息 */}
          <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
            <span>{formattedDate}</span>
            <span className="flex items-center gap-1">
              <Eye size={14} />
              {article.views}
            </span>
          </div>
        </header>

        {/* 文章内容 */}
        <div
          className="article-content"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />

        {/* 相关推荐 */}
        {relatedArticles.length > 0 && (
          <section className="mt-10 pt-6 border-t border-gray-100">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">相关推荐</h2>
            <div className="space-y-3">
              {relatedArticles.map(item => (
                <ArticleCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  summary={item.summary}
                  category={item.category}
                  views={item.views}
                  isFavorited={false}
                />
              ))}
            </div>
          </section>
        )}
      </article>

      {/* 底部操作栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 safe-area-pb">
        <div className="flex items-center justify-around max-w-lg mx-auto h-14">
          <button
            onClick={handleToggleFavorite}
            className="flex flex-col items-center gap-0.5 px-4 py-1"
          >
            <Heart
              size={20}
              className={isFavorited ? "text-red-500 fill-red-500" : "text-gray-400 dark:text-gray-500"}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">收藏</span>
          </button>
          <button
            onClick={handleShare}
            className="flex flex-col items-center gap-0.5 px-4 py-1"
          >
            <Share2 size={20} className="text-gray-400 dark:text-gray-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">分享</span>
          </button>
          <button
            onClick={scrollToTop}
            className="flex flex-col items-center gap-0.5 px-4 py-1"
          >
            <ChevronUp size={20} className="text-gray-400 dark:text-gray-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">顶部</span>
          </button>
        </div>
      </div>

      {/* 为底部操作栏留出空间 */}
      <div className="h-14" />
    </div>
  )
}
