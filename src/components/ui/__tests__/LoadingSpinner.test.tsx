import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { LoadingSpinner } from "../LoadingSpinner"

describe("LoadingSpinner", () => {
  describe("默认渲染", () => {
    it("默认不显示文字", () => {
      render(<LoadingSpinner />)
      expect(screen.queryByText("加载中...")).not.toBeInTheDocument()
    })

    it("应渲染旋转容器 div", () => {
      const { container } = render(<LoadingSpinner />)
      // 外层 flex 容器
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.className).toContain("flex")
      expect(wrapper.className).toContain("flex-col")
      expect(wrapper.className).toContain("items-center")
    })
  })

  describe("旋转动画", () => {
    it("应渲染带 animate-spin 的旋转元素", () => {
      const { container } = render(<LoadingSpinner />)
      const wrapper = container.firstChild as HTMLElement
      const spinner = wrapper.firstChild as HTMLElement
      expect(spinner.className).toContain("animate-spin")
      expect(spinner.className).toContain("rounded-full")
    })

    it("旋转元素应使用品牌绿色边框", () => {
      const { container } = render(<LoadingSpinner />)
      const wrapper = container.firstChild as HTMLElement
      const spinner = wrapper.firstChild as HTMLElement
      expect(spinner.className).toContain("border-[#4CAF50]")
    })

    it("旋转元素应有透明顶边框形成旋转效果", () => {
      const { container } = render(<LoadingSpinner />)
      const wrapper = container.firstChild as HTMLElement
      const spinner = wrapper.firstChild as HTMLElement
      expect(spinner.className).toContain("border-t-transparent")
    })
  })

  describe("文字显示", () => {
    it("showText=true 时应显示默认加载文字", () => {
      render(<LoadingSpinner showText />)
      expect(screen.getByText("加载中...")).toBeInTheDocument()
    })

    it("showText=false 时不应显示文字", () => {
      render(<LoadingSpinner showText={false} />)
      expect(screen.queryByText("加载中...")).not.toBeInTheDocument()
    })

    it("自定义 text 应正确显示", () => {
      render(<LoadingSpinner showText text="正在加载数据..." />)
      expect(screen.getByText("正在加载数据...")).toBeInTheDocument()
    })

    it("自定义 text 时不应显示默认文字", () => {
      render(<LoadingSpinner showText text="请稍候" />)
      expect(screen.queryByText("加载中...")).not.toBeInTheDocument()
      expect(screen.getByText("请稍候")).toBeInTheDocument()
    })

    it("文字应使用灰色小号字体", () => {
      render(<LoadingSpinner showText />)
      const text = screen.getByText("加载中...")
      expect(text.className).toContain("text-sm")
      expect(text.className).toContain("text-gray-500")
    })
  })

  describe("自定义 className", () => {
    it("应将自定义 className 合并到旋转元素", () => {
      const { container } = render(<LoadingSpinner className="w-12 h-12" />)
      const wrapper = container.firstChild as HTMLElement
      const spinner = wrapper.firstChild as HTMLElement
      expect(spinner.className).toContain("w-12")
      expect(spinner.className).toContain("h-12")
      // 默认类名仍应存在
      expect(spinner.className).toContain("animate-spin")
      expect(spinner.className).toContain("rounded-full")
    })

    it("自定义 className 可覆盖默认尺寸", () => {
      const { container } = render(<LoadingSpinner className="w-16 h-16" />)
      const wrapper = container.firstChild as HTMLElement
      const spinner = wrapper.firstChild as HTMLElement
      expect(spinner.className).toContain("w-16")
      expect(spinner.className).toContain("h-16")
    })
  })

  describe("布局结构", () => {
    it("showText=true 时应渲染两个子元素（旋转器 + 文字）", () => {
      const { container } = render(<LoadingSpinner showText />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.children.length).toBe(2)
    })

    it("showText=false 时应只渲染一个子元素（旋转器）", () => {
      const { container } = render(<LoadingSpinner />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.children.length).toBe(1)
    })
  })
})
