import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { CheckinButton } from "../CheckinButton"

const defaultProps = {
  label: "早起打卡",
  onCheckin: vi.fn<() => Promise<{ points: number }>>(),
}

describe("CheckinButton", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  describe("默认状态渲染", () => {
    it("应显示 label 文字", () => {
      render(<CheckinButton {...defaultProps} />)
      expect(screen.getByText("早起打卡")).toBeInTheDocument()
    })

    it("不应显示已完成", () => {
      render(<CheckinButton {...defaultProps} />)
      expect(screen.queryByText("已完成")).not.toBeInTheDocument()
    })
  })

  describe("已打卡状态", () => {
    it("checked=true 时应显示已完成", () => {
      render(<CheckinButton {...defaultProps} checked />)
      expect(screen.getByText("已完成")).toBeInTheDocument()
    })

    it("checked=true 时不应显示 label", () => {
      render(<CheckinButton {...defaultProps} checked />)
      expect(screen.queryByText("早起打卡")).not.toBeInTheDocument()
    })
  })

  describe("禁用状态", () => {
    it("disabled=true 时不触发回调", () => {
      const onCheckin = vi.fn()
      render(<CheckinButton {...defaultProps} onCheckin={onCheckin} disabled />)

      fireEvent.click(screen.getByRole("button"))

      expect(onCheckin).not.toHaveBeenCalled()
    })
  })

  describe("打卡流程", () => {
    it("点击成功后应显示积分动画", async () => {
      vi.useFakeTimers()
      const onCheckin = vi.fn().mockResolvedValue({ points: 10 })
      render(<CheckinButton {...defaultProps} onCheckin={onCheckin} />)

      fireEvent.click(screen.getByRole("button"))

      // 等待 onCheckin resolve 并执行 setState
      await vi.advanceTimersByTimeAsync(0)

      expect(screen.getByText("+10")).toBeInTheDocument()
      expect(screen.getByText("已完成")).toBeInTheDocument()
    })

    it("点击中再次点击不重复触发", async () => {
      vi.useFakeTimers()
      let resolveCheckin: (value: { points: number }) => void
      const onCheckin = vi.fn().mockImplementation(
        () => new Promise<{ points: number }>(r => { resolveCheckin = r })
      )
      render(<CheckinButton {...defaultProps} onCheckin={onCheckin} />)

      // 第一次点击
      fireEvent.click(screen.getByRole("button"))
      expect(onCheckin).toHaveBeenCalledTimes(1)

      // 第二次点击（animating 状态中）
      fireEvent.click(screen.getByRole("button"))
      expect(onCheckin).toHaveBeenCalledTimes(1)

      // 清理
      resolveCheckin!({ points: 5 })
      await vi.advanceTimersByTimeAsync(0)
    })

    it("onCheckin 抛错时不改变状态", async () => {
      // 组件 handleClick 只有 finally 没有 catch，rejected promise 会成为 unhandled rejection
      const onCheckin = vi.fn().mockRejectedValue(new Error("网络错误"))
      const suppress = vi.fn()
      process.on("unhandledRejection", suppress)

      render(<CheckinButton {...defaultProps} onCheckin={onCheckin} />)

      fireEvent.click(screen.getByRole("button"))

      await waitFor(() => {
        expect(onCheckin).toHaveBeenCalled()
      })

      // 按钮应恢复为可点击状态，仍显示 label
      expect(screen.getByText("早起打卡")).toBeInTheDocument()
      expect(screen.queryByText("已完成")).not.toBeInTheDocument()

      process.removeListener("unhandledRejection", suppress)
    })
  })
})
