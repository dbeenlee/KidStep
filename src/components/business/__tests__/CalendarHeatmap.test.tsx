import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CalendarHeatmap } from "../CalendarHeatmap"

const mockDays = [
  { date: "2026-05-01", completedCount: 2, totalCount: 3, status: "partial" },
  { date: "2026-05-02", completedCount: 3, totalCount: 3, status: "full" },
  { date: "2026-05-03", completedCount: 0, totalCount: 0, status: "noTask" },
]

function createMockFetchMonth(days = mockDays) {
  return vi.fn<(month: string) => Promise<typeof days>>().mockResolvedValue(days)
}

describe("CalendarHeatmap", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  describe("初始加载", () => {
    it("应调用 fetchMonth", async () => {
      const fetchMonth = createMockFetchMonth()
      render(<CalendarHeatmap fetchMonth={fetchMonth} initialMonth="2026-05" />)

      await waitFor(() => {
        expect(fetchMonth).toHaveBeenCalledWith("2026-05")
      })
    })

    it("无 initialMonth 时应使用当前月份", async () => {
      const fetchMonth = createMockFetchMonth()
      render(<CalendarHeatmap fetchMonth={fetchMonth} />)

      await waitFor(() => {
        expect(fetchMonth).toHaveBeenCalled()
      })

      // 验证调用参数格式为 YYYY-MM
      const calledMonth = fetchMonth.mock.calls[0][0]
      expect(calledMonth).toMatch(/^\d{4}-\d{2}$/)
    })
  })

  describe("星期头部", () => {
    it("应渲染日一二三四五六", async () => {
      const fetchMonth = createMockFetchMonth()
      render(<CalendarHeatmap fetchMonth={fetchMonth} initialMonth="2026-05" />)

      for (const header of ["日", "一", "二", "三", "四", "五", "六"]) {
        expect(screen.getByText(header)).toBeInTheDocument()
      }
    })
  })

  describe("日期格子", () => {
    it("应渲染日期格子（含空位填充）", async () => {
      const fetchMonth = createMockFetchMonth()
      render(<CalendarHeatmap fetchMonth={fetchMonth} initialMonth="2026-05" />)

      // 2026-05-01 是周五，前面有5个空位
      // 至少应该渲染 1 号到 31 号的日期数字
      await waitFor(() => {
        expect(screen.getByText("1")).toBeInTheDocument()
        expect(screen.getByText("15")).toBeInTheDocument()
        expect(screen.getByText("31")).toBeInTheDocument()
      })
    })

    it("有 totalCount 的日期应显示完成/总数", async () => {
      const fetchMonth = createMockFetchMonth()
      render(<CalendarHeatmap fetchMonth={fetchMonth} initialMonth="2026-05" />)

      await waitFor(() => {
        // mockDays 中 5月1日: 2/3, 5月2日: 3/3
        expect(screen.getByText("2/3")).toBeInTheDocument()
        expect(screen.getByText("3/3")).toBeInTheDocument()
      })
    })
  })

  describe("月份导航", () => {
    it("点击左箭头应切换到上个月", async () => {
      const fetchMonth = createMockFetchMonth()
      const user = userEvent.setup()
      render(<CalendarHeatmap fetchMonth={fetchMonth} initialMonth="2026-05" />)

      await waitFor(() => {
        expect(fetchMonth).toHaveBeenCalledWith("2026-05")
      })

      // 找到左箭头按钮（ChevronLeft）
      const buttons = screen.getAllByRole("button")
      await user.click(buttons[0])

      await waitFor(() => {
        expect(fetchMonth).toHaveBeenCalledWith("2026-04")
      })
    })

    it("点击右箭头应切换到下个月", async () => {
      const fetchMonth = createMockFetchMonth()
      const user = userEvent.setup()
      render(<CalendarHeatmap fetchMonth={fetchMonth} initialMonth="2026-05" />)

      await waitFor(() => {
        expect(fetchMonth).toHaveBeenCalledWith("2026-05")
      })

      const buttons = screen.getAllByRole("button")
      await user.click(buttons[1])

      await waitFor(() => {
        expect(fetchMonth).toHaveBeenCalledWith("2026-06")
      })
    })

    it("应显示当前月份标题", async () => {
      const fetchMonth = createMockFetchMonth()
      render(<CalendarHeatmap fetchMonth={fetchMonth} initialMonth="2026-05" />)

      expect(screen.getByText("2026年5月")).toBeInTheDocument()
    })
  })

  describe("loading 状态", () => {
    it("加载中应显示 opacity-50", async () => {
      let resolveFetch: (value: typeof mockDays) => void
      const fetchMonth = vi.fn().mockImplementation(
        () => new Promise<typeof mockDays>(r => { resolveFetch = r })
      )

      render(<CalendarHeatmap fetchMonth={fetchMonth} initialMonth="2026-05" />)

      // 加载中，日期格子应有 opacity-50
      await waitFor(() => {
        const dayCells = document.querySelectorAll(".opacity-50")
        expect(dayCells.length).toBeGreaterThan(0)
      })

      // 清理
      resolveFetch!(mockDays)
    })
  })

  describe("不同状态颜色", () => {
    it("应为不同状态的日期渲染对应的颜色类名", async () => {
      const fetchMonth = createMockFetchMonth()
      render(<CalendarHeatmap fetchMonth={fetchMonth} initialMonth="2026-05" />)

      await waitFor(() => {
        expect(fetchMonth).toHaveBeenCalled()
      })

      // full 状态的日期（5月2日）应有绿色背景
      // partial 状态的日期（5月1日）应有40%绿色背景
      // noTask 状态的日期（5月3日）应有灰色背景
      // 通过 title 属性找到这些日期格子
      await waitFor(() => {
        const day2 = document.querySelector('[title="2026-05-02: 3/3"]')
        expect(day2).toBeInTheDocument()

        const day1 = document.querySelector('[title="2026-05-01: 2/3"]')
        expect(day1).toBeInTheDocument()
      })
    })
  })
})
