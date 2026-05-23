import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"

// Mock @radix-ui/react-toast，因为 jsdom 不完全支持 Radix Portal/Animation
vi.mock("@radix-ui/react-toast", () => ({
  Root: ({ children, open, className }: { children: React.ReactNode; open?: boolean; className?: string }) =>
    open ? <div data-testid="toast-root" className={className}>{children}</div> : null,
  Title: ({ children, className }: { children: React.ReactNode; className?: string }) =>
    <div className={className}>{children}</div>,
  Description: ({ children, className }: { children: React.ReactNode; className?: string }) =>
    <div className={className}>{children}</div>,
  Close: ({ children, className }: { children: React.ReactNode; className?: string }) =>
    <button className={className}>{children}</button>,
  Viewport: ({ className }: { className?: string }) =>
    <div className={className} data-testid="toast-viewport" />,
  Provider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import { Toast, ToastViewport } from "../Toast"

describe("Toast", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
  }

  describe("基本渲染", () => {
    it("open=true 时应渲染 title 和 description", () => {
      render(
        <Toast
          {...defaultProps}
          title="操作成功"
          description="数据已保存"
        />
      )
      expect(screen.getByText("操作成功")).toBeInTheDocument()
      expect(screen.getByText("数据已保存")).toBeInTheDocument()
    })

    it("open=false 时不渲染内容", () => {
      render(
        <Toast
          {...defaultProps}
          open={false}
          title="操作成功"
          description="数据已保存"
        />
      )
      expect(screen.queryByText("操作成功")).not.toBeInTheDocument()
      expect(screen.queryByText("数据已保存")).not.toBeInTheDocument()
    })
  })

  describe("变体图标", () => {
    it("variant=success 时应渲染 CheckCircle2 图标", () => {
      const { container } = render(
        <Toast {...defaultProps} variant="success" title="成功" />
      )
      // lucide-react 渲染的 SVG 类名包含 lucide-circle-check
      const svg = container.querySelector("svg.lucide-circle-check")
      expect(svg).toBeInTheDocument()
    })

    it("variant=error 时应渲染 AlertCircle 图标", () => {
      const { container } = render(
        <Toast {...defaultProps} variant="error" title="错误" />
      )
      // lucide-react 渲染的 SVG 类名包含 lucide-circle-alert
      const svg = container.querySelector("svg.lucide-circle-alert")
      expect(svg).toBeInTheDocument()
    })

    it("variant=info 时应渲染 Info 图标（默认）", () => {
      const { container } = render(
        <Toast {...defaultProps} title="提示" />
      )
      // lucide-react 渲染的 SVG 类名包含 lucide-info
      const svg = container.querySelector("svg.lucide-info")
      expect(svg).toBeInTheDocument()
    })

    it("不传 variant 时默认使用 info 图标", () => {
      const { container } = render(
        <Toast {...defaultProps} title="默认提示" />
      )
      const infoSvg = container.querySelector("svg.lucide-info")
      expect(infoSvg).toBeInTheDocument()
    })
  })

  describe("空内容处理", () => {
    it("title 为空时不渲染标题", () => {
      render(<Toast {...defaultProps} description="仅描述" />)
      expect(screen.getByText("仅描述")).toBeInTheDocument()
      // 无 title 对应的文本
      expect(screen.queryByRole("heading")).not.toBeInTheDocument()
    })

    it("description 为空时不渲染描述", () => {
      render(<Toast {...defaultProps} title="仅标题" />)
      expect(screen.getByText("仅标题")).toBeInTheDocument()
    })

    it("title 和 description 都为空时只渲染图标和关闭按钮", () => {
      const { container } = render(<Toast {...defaultProps} />)
      expect(screen.getByTestId("toast-root")).toBeInTheDocument()
      // 关闭按钮存在
      expect(container.querySelector("button")).toBeInTheDocument()
    })
  })

  describe("关闭按钮", () => {
    it("应渲染关闭按钮", () => {
      const { container } = render(
        <Toast {...defaultProps} title="可关闭" />
      )
      const closeBtn = container.querySelector("button")
      expect(closeBtn).toBeInTheDocument()
    })

    it("关闭按钮应包含 X 图标", () => {
      const { container } = render(
        <Toast {...defaultProps} title="可关闭" />
      )
      const xIcon = container.querySelector("svg.lucide-x")
      expect(xIcon).toBeInTheDocument()
    })
  })

  describe("变体样式", () => {
    it("variant=success 时根元素含绿色样式类", () => {
      const { container } = render(
        <Toast {...defaultProps} variant="success" title="成功" />
      )
      const root = container.firstChild as HTMLElement
      expect(root.className).toContain("border-green-200")
      expect(root.className).toContain("bg-green-50")
    })

    it("variant=error 时根元素含红色样式类", () => {
      const { container } = render(
        <Toast {...defaultProps} variant="error" title="错误" />
      )
      const root = container.firstChild as HTMLElement
      expect(root.className).toContain("border-red-200")
      expect(root.className).toContain("bg-red-50")
    })

    it("variant=info 时根元素含蓝色样式类", () => {
      const { container } = render(
        <Toast {...defaultProps} variant="info" title="提示" />
      )
      const root = container.firstChild as HTMLElement
      expect(root.className).toContain("border-blue-200")
      expect(root.className).toContain("bg-blue-50")
    })
  })

  describe("图标颜色", () => {
    it("variant=success 时图标含绿色文字类", () => {
      const { container } = render(
        <Toast {...defaultProps} variant="success" title="成功" />
      )
      const icon = container.querySelector("svg.lucide-circle-check") as SVGSVGElement
      expect(icon.className.baseVal).toContain("text-green-600")
    })

    it("variant=error 时图标含红色文字类", () => {
      const { container } = render(
        <Toast {...defaultProps} variant="error" title="错误" />
      )
      const icon = container.querySelector("svg.lucide-circle-alert") as SVGSVGElement
      expect(icon.className.baseVal).toContain("text-red-600")
    })

    it("variant=info 时图标含蓝色文字类", () => {
      const { container } = render(
        <Toast {...defaultProps} variant="info" title="提示" />
      )
      const icon = container.querySelector("svg.lucide-info") as SVGSVGElement
      expect(icon.className.baseVal).toContain("text-blue-600")
    })
  })
})

describe("ToastViewport", () => {
  it("应渲染视口容器", () => {
    render(<ToastViewport />)
    expect(screen.getByTestId("toast-viewport")).toBeInTheDocument()
  })
})
