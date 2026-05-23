import { describe, it, expect } from "vitest"
import { getDayStatus, buildCalendarDays } from "../calendarStatus"

describe("calendarStatus", () => {
  describe("getDayStatus", () => {
    it("total=0 → 'noTask'", () => {
      expect(getDayStatus(0, 0)).toBe("noTask")
    })

    it("completed=3, total=3 → 'full'", () => {
      expect(getDayStatus(3, 3)).toBe("full")
    })

    it("completed=1, total=3 → 'partial'", () => {
      expect(getDayStatus(1, 3)).toBe("partial")
    })

    it("completed=0, total=3 → 'none'", () => {
      expect(getDayStatus(0, 3)).toBe("none")
    })
  })

  describe("buildCalendarDays", () => {
    it("空任务数组 → 全月 noTask", () => {
      const calendar = buildCalendarDays([], 2026, 5)
      // 5 月有 31 天
      expect(calendar).toHaveLength(31)
      expect(calendar[0].status).toBe("noTask")
      expect(calendar[0].date).toBe("2026-05-01")
      expect(calendar[30].date).toBe("2026-05-31")
      calendar.forEach((day) => {
        expect(day.status).toBe("noTask")
        expect(day.completedCount).toBe(0)
        expect(day.totalCount).toBe(0)
      })
    })

    it("某天 3 个任务全完成 → full", () => {
      const tasks = [
        { scheduledDate: new Date("2026-05-10"), status: "COMPLETED" },
        { scheduledDate: new Date("2026-05-10"), status: "COMPLETED" },
        { scheduledDate: new Date("2026-05-10"), status: "COMPLETED" },
      ]
      const calendar = buildCalendarDays(tasks, 2026, 5)
      const day10 = calendar.find((d) => d.date === "2026-05-10")
      expect(day10).toBeDefined()
      expect(day10!.status).toBe("full")
      expect(day10!.completedCount).toBe(3)
      expect(day10!.totalCount).toBe(3)
    })

    it("某天 2/3 完成 → partial", () => {
      const tasks = [
        { scheduledDate: new Date("2026-05-10"), status: "COMPLETED" },
        { scheduledDate: new Date("2026-05-10"), status: "COMPLETED" },
        { scheduledDate: new Date("2026-05-10"), status: "PENDING" },
      ]
      const calendar = buildCalendarDays(tasks, 2026, 5)
      const day10 = calendar.find((d) => d.date === "2026-05-10")
      expect(day10).toBeDefined()
      expect(day10!.status).toBe("partial")
      expect(day10!.completedCount).toBe(2)
      expect(day10!.totalCount).toBe(3)
    })

    it("某天有任务但未完成 → none", () => {
      const tasks = [
        { scheduledDate: new Date("2026-05-10"), status: "PENDING" },
        { scheduledDate: new Date("2026-05-10"), status: "PENDING" },
      ]
      const calendar = buildCalendarDays(tasks, 2026, 5)
      const day10 = calendar.find((d) => d.date === "2026-05-10")
      expect(day10).toBeDefined()
      expect(day10!.status).toBe("none")
      expect(day10!.completedCount).toBe(0)
      expect(day10!.totalCount).toBe(2)
    })

    it("2 月闰年（2026 非闰年 28 天）", () => {
      const calendar = buildCalendarDays([], 2026, 2)
      expect(calendar).toHaveLength(28)
      expect(calendar[0].date).toBe("2026-02-01")
      expect(calendar[27].date).toBe("2026-02-28")
    })

    it("2 月闰年（2024 闰年 29 天）", () => {
      const calendar = buildCalendarDays([], 2024, 2)
      expect(calendar).toHaveLength(29)
      expect(calendar[0].date).toBe("2024-02-01")
      expect(calendar[28].date).toBe("2024-02-29")
    })
  })
})
