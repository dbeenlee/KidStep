import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { TaskCard } from "../TaskCard"

const defaultProps = {
  id: "task-1",
  title: "早起打卡",
  description: "7:00前起床",
  taskType: "HABIT",
  duration: 5,
  onComplete: vi.fn<(taskId: string) => Promise<{ points: number; encouragement: string }>>(),
  onSkip: vi.fn<(taskId: string) => Promise<void>>(),
}

describe("TaskCard", () => {
  // 确保每次测试后恢复真实定时器
  afterEach(() => {
    vi.useRealTimers()
  })

  describe("idle 状态渲染", () => {
    it("应渲染标题和描述", () => {
      render(<TaskCard {...defaultProps} />)
      expect(screen.getByText("早起打卡")).toBeInTheDocument()
      expect(screen.getByText("7:00前起床")).toBeInTheDocument()
    })

    it("应渲染任务类型标签", () => {
      render(<TaskCard {...defaultProps} />)
      expect(screen.getByText("习惯")).toBeInTheDocument()
    })

    it("应渲染不同类型的任务标签", () => {
      const { unmount } = render(<TaskCard {...defaultProps} taskType="ABILITY" />)
      expect(screen.getByText("能力")).toBeInTheDocument()
      unmount()

      const { unmount: unmount2 } = render(<TaskCard {...defaultProps} taskType="BONDING" />)
      expect(screen.getByText("亲子")).toBeInTheDocument()
      unmount2()

      render(<TaskCard {...defaultProps} taskType="KNOWLEDGE" />)
      expect(screen.getByText("知识")).toBeInTheDocument()
    })

    it("应渲染时长信息", () => {
      render(<TaskCard {...defaultProps} />)
      expect(screen.getByText("5分钟")).toBeInTheDocument()
    })

    it("无 description 时不渲染描述文本", () => {
      render(<TaskCard {...defaultProps} description={null} />)
      expect(screen.queryByText("7:00前起床")).not.toBeInTheDocument()
      // 标题仍应正常渲染
      expect(screen.getByText("早起打卡")).toBeInTheDocument()
    })

    it("duration 为 null 时不渲染时长", () => {
      render(<TaskCard {...defaultProps} duration={null} />)
      expect(screen.queryByText(/分钟/)).not.toBeInTheDocument()
    })

    it("未知 taskType 应 fallback 到习惯类型", () => {
      render(<TaskCard {...defaultProps} taskType="UNKNOWN" />)
      expect(screen.getByText("习惯")).toBeInTheDocument()
    })
  })

  describe("完成任务流程", () => {
    it("点击完成按钮应调用 onComplete(id)", async () => {
      const onComplete = vi.fn().mockResolvedValue({ points: 10, encouragement: "棒极了！" })
      render(<TaskCard {...defaultProps} onComplete={onComplete} />)

      fireEvent.click(screen.getByRole("button", { name: "完成任务" }))

      expect(onComplete).toHaveBeenCalledWith("task-1")
    })

    it("onComplete 成功后应显示积分和鼓励语", async () => {
      vi.useFakeTimers()
      const onComplete = vi.fn().mockResolvedValue({ points: 15, encouragement: "太棒了！" })
      render(<TaskCard {...defaultProps} onComplete={onComplete} />)

      fireEvent.click(screen.getByRole("button", { name: "完成任务" }))

      // 刷新微任务队列，让 onComplete Promise 完成并执行后续 setState
      await vi.advanceTimersByTimeAsync(0)
      // 推进 800ms 定时器，让组件进入 done 状态
      await vi.advanceTimersByTimeAsync(800)

      expect(screen.getByText("+15分")).toBeInTheDocument()
      expect(screen.getByText("太棒了！")).toBeInTheDocument()
    })

    it("onComplete 成功后应显示'任务完成！'文本", async () => {
      vi.useFakeTimers()
      const onComplete = vi.fn().mockResolvedValue({ points: 10, encouragement: "加油" })
      render(<TaskCard {...defaultProps} onComplete={onComplete} />)

      fireEvent.click(screen.getByRole("button", { name: "完成任务" }))
      await vi.advanceTimersByTimeAsync(0)
      await vi.advanceTimersByTimeAsync(800)

      expect(screen.getByText("任务完成！")).toBeInTheDocument()
    })

    it("onComplete 成功后应显示撒花动画（ConfettiEffect）", async () => {
      vi.useFakeTimers()
      const onComplete = vi.fn().mockResolvedValue({ points: 10, encouragement: "好样的" })
      render(<TaskCard {...defaultProps} onComplete={onComplete} />)

      fireEvent.click(screen.getByRole("button", { name: "完成任务" }))
      await vi.advanceTimersByTimeAsync(0)
      await vi.advanceTimersByTimeAsync(800)
      // useEffect 在 done 状态首次渲染后执行，需要再刷新一次微任务
      await vi.advanceTimersByTimeAsync(0)

      expect(screen.getByText("任务完成！")).toBeInTheDocument()
      // ConfettiEffect 渲染带 animate-confetti 类名的粒子
      const confettiDiv = document.querySelector(".animate-confetti")
      expect(confettiDiv).toBeInTheDocument()
    })
  })

  describe("跳过任务流程", () => {
    it("点击跳过按钮应调用 onSkip(id)", async () => {
      const onSkip = vi.fn().mockResolvedValue(undefined)
      render(<TaskCard {...defaultProps} onSkip={onSkip} />)

      fireEvent.click(screen.getByRole("button", { name: "跳过任务" }))

      expect(onSkip).toHaveBeenCalledWith("task-1")
    })

    it("onSkip 完成后应回到 idle 状态", async () => {
      const onSkip = vi.fn().mockResolvedValue(undefined)
      render(<TaskCard {...defaultProps} onSkip={onSkip} />)

      fireEvent.click(screen.getByRole("button", { name: "跳过任务" }))

      // onSkip 完成后回到 idle，按钮应恢复可用
      await waitFor(() => {
        expect(onSkip).toHaveBeenCalled()
        const completeBtn = screen.getByRole("button", { name: "完成任务" })
        expect(completeBtn).toBeEnabled()
      })

      expect(screen.getByText("早起打卡")).toBeInTheDocument()
    })
  })

  describe("错误处理", () => {
    it("onComplete 抛错时应回到 idle 状态，按钮可再次点击", async () => {
      const onComplete = vi.fn().mockRejectedValue(new Error("网络错误"))
      render(<TaskCard {...defaultProps} onComplete={onComplete} />)

      fireEvent.click(screen.getByRole("button", { name: "完成任务" }))

      // 回到 idle，按钮恢复可用
      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled()
        const completeBtn = screen.getByRole("button", { name: "完成任务" })
        expect(completeBtn).toBeEnabled()
      })

      // 标题仍在
      expect(screen.getByText("早起打卡")).toBeInTheDocument()
    })
  })

  describe("按钮禁用", () => {
    it("completing 状态时两个按钮都禁用", async () => {
      // 使用不会立即 resolve 的 Promise 来保持 completing 状态
      let resolveComplete: (value: { points: number; encouragement: string }) => void
      const onComplete = vi.fn().mockImplementation(
        () => new Promise<{ points: number; encouragement: string }>(r => { resolveComplete = r })
      )
      render(<TaskCard {...defaultProps} onComplete={onComplete} />)

      fireEvent.click(screen.getByRole("button", { name: "完成任务" }))

      // 等待状态切换到 completing
      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled()
      })

      const completeBtn = screen.getByRole("button", { name: "完成任务" })
      const skipBtn = screen.getByRole("button", { name: "跳过任务" })
      expect(completeBtn).toBeDisabled()
      expect(skipBtn).toBeDisabled()

      // 清理：resolve Promise 以避免未处理的 rejection
      resolveComplete!({ points: 5, encouragement: "好" })
    })

    it("skipping 状态时两个按钮都禁用", async () => {
      // 使用不会立即 resolve 的 Promise 来保持 skipping 状态
      let resolveSkip: () => void
      const onSkip = vi.fn().mockImplementation(
        () => new Promise<void>(r => { resolveSkip = r })
      )
      render(<TaskCard {...defaultProps} onSkip={onSkip} />)

      fireEvent.click(screen.getByRole("button", { name: "跳过任务" }))

      await waitFor(() => {
        expect(onSkip).toHaveBeenCalled()
      })

      const completeBtn = screen.getByRole("button", { name: "完成任务" })
      const skipBtn = screen.getByRole("button", { name: "跳过任务" })
      expect(completeBtn).toBeDisabled()
      expect(skipBtn).toBeDisabled()

      // 清理
      resolveSkip!()
    })
  })
})
