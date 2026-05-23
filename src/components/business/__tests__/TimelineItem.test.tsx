import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { TimelineItem } from "../TimelineItem"

function createMilestone(overrides: Partial<{
  id: string
  type: string
  content: string | null
  mediaUrls: string | null
  createdAt: string
}> = {}) {
  return {
    id: "ms-1",
    type: "TEXT",
    content: "今天学会了自己穿鞋",
    mediaUrls: null,
    createdAt: "2026-05-15T10:30:00.000Z",
    ...overrides,
  }
}

describe("TimelineItem", () => {
  describe("TEXT 类型", () => {
    it("应渲染文字记录标签", () => {
      render(
        <TimelineItem milestone={createMilestone({ type: "TEXT" })} onDelete={vi.fn()} />
      )
      expect(screen.getByText("文字记录")).toBeInTheDocument()
    })

    it("应渲染文字内容", () => {
      render(
        <TimelineItem milestone={createMilestone({ type: "TEXT", content: "今天学会了自己穿鞋" })} onDelete={vi.fn()} />
      )
      expect(screen.getByText("今天学会了自己穿鞋")).toBeInTheDocument()
    })
  })

  describe("PHOTO 类型", () => {
    it("应渲染照片标签", () => {
      render(
        <TimelineItem
          milestone={createMilestone({ type: "PHOTO", mediaUrls: '["/img/1.jpg"]' })}
          onDelete={vi.fn()}
        />
      )
      expect(screen.getByText("照片")).toBeInTheDocument()
    })

    it("应渲染缩略图网格", () => {
      render(
        <TimelineItem
          milestone={createMilestone({
            type: "PHOTO",
            mediaUrls: '["/img/1.jpg", "/img/2.jpg"]',
          })}
          onDelete={vi.fn()}
        />
      )
      const images = screen.getAllByRole("img")
      expect(images).toHaveLength(2)
      expect(images[0]).toHaveAttribute("src", "/img/1.jpg")
      expect(images[1]).toHaveAttribute("src", "/img/2.jpg")
    })
  })

  describe("ASSESSMENT 类型", () => {
    it("应渲染评估记录标签", () => {
      render(
        <TimelineItem milestone={createMilestone({ type: "ASSESSMENT" })} onDelete={vi.fn()} />
      )
      expect(screen.getByText("评估记录")).toBeInTheDocument()
    })
  })

  describe("删除操作", () => {
    it("点击删除按钮应调用 onDelete", async () => {
      const onDelete = vi.fn()
      const user = userEvent.setup()
      render(<TimelineItem milestone={createMilestone()} onDelete={onDelete} />)

      // 删除按钮是带有 Trash2 图标的按钮
      const deleteButton = screen.getByRole("button", { name: "" })
      await user.click(deleteButton)

      expect(onDelete).toHaveBeenCalledWith("ms-1")
    })
  })

  describe("无内容", () => {
    it("content 为 null 时不渲染文本段落", () => {
      render(
        <TimelineItem milestone={createMilestone({ content: null })} onDelete={vi.fn()} />
      )
      // 不应有 text-gray-700 的 p 标签
      const contentParagraph = document.querySelector("p.text-sm.text-gray-700")
      expect(contentParagraph).not.toBeInTheDocument()
    })
  })

  describe("大图预览", () => {
    it("点击缩略图应打开大图预览", async () => {
      const user = userEvent.setup()
      render(
        <TimelineItem
          milestone={createMilestone({
            type: "PHOTO",
            mediaUrls: '["/img/1.jpg", "/img/2.jpg"]',
          })}
          onDelete={vi.fn()}
        />
      )

      // 点击第一张缩略图
      const thumbnails = screen.getAllByRole("img")
      await user.click(thumbnails[0])

      // 应显示大图预览模态框（带 X 关闭按钮）
      expect(screen.getByText("上一张")).toBeInTheDocument()
      expect(screen.getByText("下一张")).toBeInTheDocument()
      expect(screen.getByText("1 / 2")).toBeInTheDocument()
    })

    it("点击遮罩应关闭大图预览", async () => {
      const user = userEvent.setup()
      render(
        <TimelineItem
          milestone={createMilestone({
            type: "PHOTO",
            mediaUrls: '["/img/1.jpg"]',
          })}
          onDelete={vi.fn()}
        />
      )

      // 打开预览
      const thumbnail = screen.getByRole("img")
      await user.click(thumbnail)

      // 找到遮罩层并点击（fixed inset-0 的 div）
      const overlay = document.querySelector(".fixed.inset-0")!
      await user.click(overlay)

      // 预览应关闭
      expect(screen.queryByText("上一张")).not.toBeInTheDocument()
    })
  })
})
