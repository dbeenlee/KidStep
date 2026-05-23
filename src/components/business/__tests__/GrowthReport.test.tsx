import { describe, it, expect, vi } from "vitest"

// @react-pdf/renderer 无法在 jsdom 环境中正常渲染，
// 因此这里只验证组件能正确导入、导出类型正确、以及 props 结构符合预期。

// mock @react-pdf/renderer 以避免 jsdom 环境报错
vi.mock("@react-pdf/renderer", () => ({
  Document: ({ children }: { children: React.ReactNode }) => children,
  Page: ({ children }: { children: React.ReactNode }) => children,
  Text: ({ children }: { children: React.ReactNode }) => children,
  View: ({ children }: { children: React.ReactNode }) => children,
  StyleSheet: { create: (styles: Record<string, object>) => styles },
  Font: { register: vi.fn() },
}))

// mock dimensions 常量
vi.mock("@/constants/dimensions", () => ({
  DIMENSION_CONFIG: {
    PHYSICAL: { label: "身心准备", color: "#4CAF50", icon: "💪", bgColor: "#E8F5E9" },
    LIFE: { label: "生活准备", color: "#FF9800", icon: "🏠", bgColor: "#FFF3E0" },
    SOCIAL: { label: "社会准备", color: "#2196F3", icon: "🤝", bgColor: "#E3F2FD" },
    LEARNING: { label: "学习准备", color: "#9C27B0", icon: "📚", bgColor: "#F3E5F5" },
  },
  getScoreLabel: (score: number) => {
    if (score >= 80) return "优秀"
    if (score >= 60) return "良好"
    if (score >= 40) return "一般"
    return "待提升"
  },
}))

import { GrowthReport } from "../GrowthReport"
import type { ReportData } from "../GrowthReport"
import { render } from "@testing-library/react"

const mockData: ReportData = {
  child: {
    name: "小明",
    birthday: "2020-06-15",
    targetSchool: "实验小学",
  },
  assessments: [
    { dimension: "PHYSICAL", score: 85, createdAt: "2026-05-01" },
    { dimension: "LIFE", score: 70, createdAt: "2026-05-01" },
    { dimension: "SOCIAL", score: 60, createdAt: "2026-05-01" },
    { dimension: "LEARNING", score: 45, createdAt: "2026-05-01" },
  ],
  milestones: [
    { type: "TEXT", content: "学会了系鞋带", mediaUrls: null, createdAt: "2026-04-10" },
    { type: "PHOTO", content: null, mediaUrls: '["/img/1.jpg"]', createdAt: "2026-05-01" },
  ],
  totalPoints: 200,
  streak: 7,
}

describe("GrowthReport", () => {
  it("组件应能正确导入不报错", () => {
    expect(GrowthReport).toBeDefined()
    expect(typeof GrowthReport).toBe("function")
  })

  it("应能正常渲染不抛异常", () => {
    expect(() => {
      render(<GrowthReport data={mockData} />)
    }).not.toThrow()
  })

  it("ReportData 类型应包含必要字段", () => {
    // 验证数据结构完整性
    expect(mockData.child).toBeDefined()
    expect(mockData.child.name).toBe("小明")
    expect(mockData.child.birthday).toBe("2020-06-15")
    expect(mockData.child.targetSchool).toBe("实验小学")

    expect(mockData.assessments).toHaveLength(4)
    expect(mockData.assessments[0]).toHaveProperty("dimension")
    expect(mockData.assessments[0]).toHaveProperty("score")
    expect(mockData.assessments[0]).toHaveProperty("createdAt")

    expect(mockData.milestones).toHaveLength(2)
    expect(mockData.milestones[0]).toHaveProperty("type")
    expect(mockData.milestones[0]).toHaveProperty("createdAt")

    expect(mockData.totalPoints).toBe(200)
    expect(mockData.streak).toBe(7)
  })

  it("应正确处理空评估列表", () => {
    const emptyData: ReportData = {
      ...mockData,
      assessments: [],
      milestones: [],
    }

    expect(() => {
      render(<GrowthReport data={emptyData} />)
    }).not.toThrow()
  })

  it("应正确处理无目标学校的情况", () => {
    const noSchoolData: ReportData = {
      ...mockData,
      child: { ...mockData.child, targetSchool: null },
    }

    expect(() => {
      render(<GrowthReport data={noSchoolData} />)
    }).not.toThrow()
  })
})
