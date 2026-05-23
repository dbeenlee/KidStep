import { describe, it, expect, vi } from "vitest"
import { calculateScore, generateRadarData } from "../scoring"
import type { QuizAnswer } from "@/types/assessment"

// mock DIMENSION_CONFIG
vi.mock("@/constants/dimensions", () => ({
  DIMENSION_CONFIG: {
    PHYSICAL: { label: "身心准备", color: "#4CAF50", icon: "💪", bgColor: "#E8F5E9" },
    LIFE: { label: "生活准备", color: "#FF9800", icon: "🏠", bgColor: "#FFF3E0" },
    SOCIAL: { label: "社会准备", color: "#2196F3", icon: "🤝", bgColor: "#E3F2FD" },
    LEARNING: { label: "学习准备", color: "#9C27B0", icon: "📚", bgColor: "#F3E5F5" },
  },
}))

describe("scoring", () => {
  describe("calculateScore", () => {
    it("全满分（score=5）应返回 100", () => {
      const answers: QuizAnswer[] = [
        { questionId: "q1", optionKey: "A", score: 5 },
        { questionId: "q2", optionKey: "A", score: 5 },
        { questionId: "q3", optionKey: "A", score: 5 },
      ]
      expect(calculateScore(answers)).toBe(100)
    })

    it("全零分（score=0）应返回 0", () => {
      const answers: QuizAnswer[] = [
        { questionId: "q1", optionKey: "D", score: 0 },
        { questionId: "q2", optionKey: "D", score: 0 },
      ]
      expect(calculateScore(answers)).toBe(0)
    })

    it("混合分数应正确归一化到 100 分制", () => {
      // 5 + 3 + 1 = 9, max = 15, 9/15*100 = 60
      const answers: QuizAnswer[] = [
        { questionId: "q1", optionKey: "A", score: 5 },
        { questionId: "q2", optionKey: "B", score: 3 },
        { questionId: "q3", optionKey: "C", score: 1 },
      ]
      expect(calculateScore(answers)).toBe(60)
    })

    it("空数组应返回 0", () => {
      expect(calculateScore([])).toBe(0)
    })

    it("单题满分应返回 100", () => {
      const answers: QuizAnswer[] = [
        { questionId: "q1", optionKey: "A", score: 5 },
      ]
      expect(calculateScore(answers)).toBe(100)
    })

    it("分数应四舍五入", () => {
      // 4/5*100 = 80, 3/5*100 = 60, 4+3=7, 7/10*100=70
      // 改用: 4+4+3=11, max=15, 11/15*100=73.33 → 73
      const answers: QuizAnswer[] = [
        { questionId: "q1", optionKey: "A", score: 4 },
        { questionId: "q2", optionKey: "A", score: 4 },
        { questionId: "q3", optionKey: "B", score: 3 },
      ]
      expect(calculateScore(answers)).toBe(73)
    })
  })

  describe("generateRadarData", () => {
    it("有分数时应正确映射到雷达图数据", () => {
      const scores = { PHYSICAL: 80, LIFE: 60 }
      const result = generateRadarData(scores)

      expect(result).toHaveLength(4)
      expect(result[0]).toEqual({ dimension: "身心准备", score: 80, fullMark: 100 })
      expect(result[1]).toEqual({ dimension: "生活准备", score: 60, fullMark: 100 })
    })

    it("缺少分数的维度应默认为 0", () => {
      const scores = { PHYSICAL: 80 }
      const result = generateRadarData(scores)

      expect(result[0].score).toBe(80)
      expect(result[1].score).toBe(0)
      expect(result[2].score).toBe(0)
      expect(result[3].score).toBe(0)
    })

    it("空对象应返回所有维度分数为 0", () => {
      const result = generateRadarData({})
      expect(result).toHaveLength(4)
      result.forEach((item) => {
        expect(item.score).toBe(0)
        expect(item.fullMark).toBe(100)
      })
    })
  })
})
