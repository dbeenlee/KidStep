import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { getCurrentPhase } from "../phaseCalculator"

describe("phaseCalculator", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe("getCurrentPhase", () => {
    it("入学前超过 30 天应返回 PHASE_1", () => {
      // 2020-03-15 出生 → 入学 2026-09-01
      // 设定今天 2026-05-01，距入学 123 天
      vi.setSystemTime(new Date(2026, 4, 1))
      expect(getCurrentPhase("2020-03-15")).toBe("PHASE_1")
    })

    it("入学前 15-30 天应返回 PHASE_2", () => {
      // 2020-03-15 出生 → 入学 2026-09-01
      // 设定今天 2026-08-07，距入学 25 天
      vi.setSystemTime(new Date(2026, 7, 7))
      expect(getCurrentPhase("2020-03-15")).toBe("PHASE_2")
    })

    it("入学前 0-14 天应返回 PHASE_3", () => {
      // 2020-03-15 出生 → 入学 2026-09-01
      // 设定今天 2026-08-25，距入学 7 天
      vi.setSystemTime(new Date(2026, 7, 25))
      expect(getCurrentPhase("2020-03-15")).toBe("PHASE_3")
    })

    it("入学当天应返回 null（已入学）", () => {
      // 2020-03-15 出生 → 入学 2026-09-01
      vi.setSystemTime(new Date(2026, 8, 1))
      expect(getCurrentPhase("2020-03-15")).toBe(null)
    })

    it("入学后应返回 null（已入学）", () => {
      // 2020-03-15 出生 → 入学 2026-09-01
      vi.setSystemTime(new Date(2026, 10, 1))
      expect(getCurrentPhase("2020-03-15")).toBe(null)
    })

    it("9月1日后出生的孩子入学年份应加 1", () => {
      // 2020-10-01 出生 → 满6岁 2026，但生日在9月1日后 → 入学 2027-09-01
      // 设定今天 2026-05-01，距入学约 488 天
      vi.setSystemTime(new Date(2026, 4, 1))
      expect(getCurrentPhase("2020-10-01")).toBe("PHASE_1")
    })

    it("9月1日后出生的孩子在入学前 15-30 天应返回 PHASE_2", () => {
      // 2020-10-01 出生 → 入学 2027-09-01
      // 设定今天 2027-08-07，距入学 25 天
      vi.setSystemTime(new Date(2027, 7, 7))
      expect(getCurrentPhase("2020-10-01")).toBe("PHASE_2")
    })

    it("恰好 9月1日出生不触发 +1 规则", () => {
      // 2020-09-01 出生 → month=8, date=1
      // 条件: month>8 || (month===8 && date>1) → false → 不+1 → 入学 2026-09-01
      vi.setSystemTime(new Date(2026, 4, 1))
      expect(getCurrentPhase("2020-09-01")).toBe("PHASE_1")
    })

    it("9月2日出生触发 +1 规则", () => {
      // 2020-09-02 出生 → month=8, date=2
      // 条件: month===8 && date>1 → true → +1 → 入学 2027-09-01
      vi.setSystemTime(new Date(2026, 4, 1))
      expect(getCurrentPhase("2020-09-02")).toBe("PHASE_1")
    })

    it("应接受 Date 对象作为参数", () => {
      vi.setSystemTime(new Date(2026, 4, 1))
      expect(getCurrentPhase(new Date(2020, 2, 15))).toBe("PHASE_1")
    })
  })
})
