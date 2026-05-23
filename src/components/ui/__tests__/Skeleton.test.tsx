import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"
import { Skeleton } from "../Skeleton"

describe("Skeleton", () => {
  it("应渲染带 animate-pulse 的 div", () => {
    const { container } = render(<Skeleton />)
    const div = container.firstChild as HTMLElement
    expect(div.tagName).toBe("DIV")
    expect(div.className).toContain("animate-pulse")
  })

  it("默认应包含 rounded-lg 和 bg-gray-200 类名", () => {
    const { container } = render(<Skeleton />)
    const div = container.firstChild as HTMLElement
    expect(div.className).toContain("rounded-lg")
    expect(div.className).toContain("bg-gray-200")
  })

  it("默认无额外 className 时应仅包含基础类名", () => {
    const { container } = render(<Skeleton />)
    const div = container.firstChild as HTMLElement
    // 基础类名存在
    expect(div.className).toContain("animate-pulse")
    expect(div.className).toContain("rounded-lg")
    expect(div.className).toContain("bg-gray-200")
  })

  it("传入自定义 className 应正确合并", () => {
    const { container } = render(<Skeleton className="w-32 h-4" />)
    const div = container.firstChild as HTMLElement
    expect(div.className).toContain("animate-pulse")
    expect(div.className).toContain("rounded-lg")
    expect(div.className).toContain("bg-gray-200")
    expect(div.className).toContain("w-32")
    expect(div.className).toContain("h-4")
  })

  it("自定义 className 可覆盖默认样式", () => {
    const { container } = render(<Skeleton className="bg-red-500" />)
    const div = container.firstChild as HTMLElement
    // Tailwind 的 cn 工具会合并类名，后者优先
    expect(div.className).toContain("bg-red-500")
    // animate-pulse 和 rounded-lg 仍应存在
    expect(div.className).toContain("animate-pulse")
    expect(div.className).toContain("rounded-lg")
  })

  it("无 children 时 div 内容应为空", () => {
    const { container } = render(<Skeleton />)
    const div = container.firstChild as HTMLElement
    expect(div.textContent).toBe("")
  })
})
