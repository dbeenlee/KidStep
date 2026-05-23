import { describe, it, expect } from "vitest"
import { calculateStreak, calculateCheckinPoints, calculateTaskPoints } from "../streakCalculator"

/** 辅助函数：创建日期对象 */
function makeDate(dateStr: string): { date: Date } {
  return { date: new Date(dateStr) }
}

describe("streakCalculator", () => {
  describe("calculateStreak", () => {
    it("空数组返回 0", () => {
      const today = new Date("2026-05-23")
      expect(calculateStreak([], today)).toBe(0)
    })

    it("连续 1 天（今天）", () => {
      const today = new Date("2026-05-23")
      const dates = [makeDate("2026-05-23")]
      expect(calculateStreak(dates, today)).toBe(1)
    })

    it("连续 7 天", () => {
      const today = new Date("2026-05-23")
      const dates = [
        makeDate("2026-05-23"),
        makeDate("2026-05-22"),
        makeDate("2026-05-21"),
        makeDate("2026-05-20"),
        makeDate("2026-05-19"),
        makeDate("2026-05-18"),
        makeDate("2026-05-17"),
      ]
      expect(calculateStreak(dates, today)).toBe(7)
    })

    it("中间断档（第 3 天缺）返回 2", () => {
      const today = new Date("2026-05-23")
      const dates = [
        makeDate("2026-05-23"),
        makeDate("2026-05-22"),
        // 05-21 缺失
        makeDate("2026-05-20"),
        makeDate("2026-05-19"),
      ]
      expect(calculateStreak(dates, today)).toBe(2)
    })

    it("今天未打卡（第一天是昨天）返回 0", () => {
      const today = new Date("2026-05-23")
      const dates = [
        makeDate("2026-05-22"),
        makeDate("2026-05-21"),
      ]
      expect(calculateStreak(dates, today)).toBe(0)
    })
  })

  describe("calculateCheckinPoints", () => {
    it("streak=0 → {base:1, bonus:0, total:1}", () => {
      expect(calculateCheckinPoints(0)).toEqual({ base: 1, bonus: 0, total: 1 })
    })

    it("streak=3 → {base:1, bonus:3, total:4}", () => {
      expect(calculateCheckinPoints(3)).toEqual({ base: 1, bonus: 3, total: 4 })
    })

    it("streak=10 → bonus 上限 7 → {base:1, bonus:7, total:8}", () => {
      expect(calculateCheckinPoints(10)).toEqual({ base: 1, bonus: 7, total: 8 })
    })
  })

  describe("calculateTaskPoints", () => {
    it("streak=0 → {base:2, bonus:0, total:2}", () => {
      expect(calculateTaskPoints(0)).toEqual({ base: 2, bonus: 0, total: 2 })
    })

    it("streak=5 → {base:2, bonus:5, total:7}", () => {
      expect(calculateTaskPoints(5)).toEqual({ base: 2, bonus: 5, total: 7 })
    })

    it("streak=100 → bonus 上限 7 → {base:2, bonus:7, total:9}", () => {
      expect(calculateTaskPoints(100)).toEqual({ base: 2, bonus: 7, total: 9 })
    })
  })
})
