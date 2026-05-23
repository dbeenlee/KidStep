import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import ArticleCard from "../ArticleCard"

// mock next/navigation
const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}))

const defaultProps = {
  id: "article-1",
  title: "幼小衔接的正确打开方式",
  summary: "帮助家长了解幼小衔接的核心要点",
  category: "CONCEPT",
  views: 128,
  isFavorited: false,
}

describe("ArticleCard", () => {
  describe("基本渲染", () => {
    it("应渲染标题", () => {
      render(<ArticleCard {...defaultProps} />)
      expect(screen.getByText("幼小衔接的正确打开方式")).toBeInTheDocument()
    })

    it("应渲染摘要", () => {
      render(<ArticleCard {...defaultProps} />)
      expect(screen.getByText("帮助家长了解幼小衔接的核心要点")).toBeInTheDocument()
    })

    it("summary 为 null 时不渲染摘要", () => {
      render(<ArticleCard {...defaultProps} summary={null} />)
      expect(screen.queryByText("帮助家长了解幼小衔接的核心要点")).not.toBeInTheDocument()
    })

    it("summary 为 undefined 时不渲染摘要", () => {
      render(<ArticleCard {...defaultProps} summary={undefined} />)
      expect(screen.queryByText("帮助家长了解幼小衔接的核心要点")).not.toBeInTheDocument()
    })
  })

  describe("分类标签", () => {
    it("CONCEPT 应显示核心概念", () => {
      render(<ArticleCard {...defaultProps} category="CONCEPT" />)
      expect(screen.getByText("核心概念")).toBeInTheDocument()
    })

    it("CHECKLIST 应显示能力清单", () => {
      render(<ArticleCard {...defaultProps} category="CHECKLIST" />)
      expect(screen.getByText("能力清单")).toBeInTheDocument()
    })

    it("SUBJECT 应显示学科指导", () => {
      render(<ArticleCard {...defaultProps} category="SUBJECT" />)
      expect(screen.getByText("学科指导")).toBeInTheDocument()
    })

    it("GUIDE 应显示家长指南", () => {
      render(<ArticleCard {...defaultProps} category="GUIDE" />)
      expect(screen.getByText("家长指南")).toBeInTheDocument()
    })

    it("FAQ 应显示常见问题", () => {
      render(<ArticleCard {...defaultProps} category="FAQ" />)
      expect(screen.getByText("常见问题")).toBeInTheDocument()
    })

    it("未知分类应显示原始值", () => {
      render(<ArticleCard {...defaultProps} category="CUSTOM" />)
      expect(screen.getByText("CUSTOM")).toBeInTheDocument()
    })
  })

  describe("浏览量", () => {
    it("应显示浏览量数字", () => {
      render(<ArticleCard {...defaultProps} views={128} />)
      expect(screen.getByText("128")).toBeInTheDocument()
    })
  })

  describe("收藏状态", () => {
    it("已收藏时 Heart 应有红色实心样式", () => {
      render(<ArticleCard {...defaultProps} isFavorited />)
      const heartIcon = document.querySelector(".fill-red-500")
      expect(heartIcon).toBeInTheDocument()
    })

    it("未收藏时 Heart 应有灰色空心样式", () => {
      render(<ArticleCard {...defaultProps} isFavorited={false} />)
      const heartIcon = document.querySelector(".text-gray-300")
      expect(heartIcon).toBeInTheDocument()
    })
  })

  describe("交互行为", () => {
    it("点击卡片应导航到文章详情", async () => {
      const user = userEvent.setup()
      render(<ArticleCard {...defaultProps} />)

      // 点击卡片主体（不是收藏按钮）
      const card = screen.getByText("幼小衔接的正确打开方式").closest("div.cursor-pointer")!
      await user.click(card)

      expect(mockPush).toHaveBeenCalledWith("/knowledge/article-1")
    })

    it("点击收藏按钮应调用 onToggleFavorite", async () => {
      const onToggleFavorite = vi.fn()
      const user = userEvent.setup()
      render(<ArticleCard {...defaultProps} onToggleFavorite={onToggleFavorite} />)

      // 找到收藏按钮（Heart 图标的父级 button）
      const heartButton = document.querySelector("button.p-1\\.5")!
      await user.click(heartButton)

      expect(onToggleFavorite).toHaveBeenCalledWith("article-1")
    })

    it("点击收藏按钮不应触发卡片导航", async () => {
      const onToggleFavorite = vi.fn()
      const user = userEvent.setup()
      render(<ArticleCard {...defaultProps} onToggleFavorite={onToggleFavorite} />)

      mockPush.mockClear()

      const heartButton = document.querySelector("button.p-1\\.5")!
      await user.click(heartButton)

      expect(onToggleFavorite).toHaveBeenCalled()
      expect(mockPush).not.toHaveBeenCalled()
    })
  })
})
