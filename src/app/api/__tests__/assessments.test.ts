import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    child: {
      findFirst: vi.fn(),
    },
    assessment: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    point: {
      create: vi.fn(),
    },
  },
}))

vi.mock("@/lib/scoring", () => ({
  calculateScore: vi.fn(() => 80),
  generateReport: vi.fn(() => ({
    strengths: ["运动能力"],
    weaknesses: ["专注力"],
    suggestions: ["用舒尔特方格训练，从5分钟开始"],
  })),
}))

vi.mock("@/constants/questions", () => ({
  QUESTIONS: [
    {
      id: "PHY-001",
      dimension: "PHYSICAL",
      category: "运动能力",
      question: "测试题目",
      options: [],
    },
  ],
}))

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { GET, POST } from "@/app/api/assessments/route"
import { calculateScore, generateReport } from "@/lib/scoring"

const mockSession = { user: { id: "user-1" } }

describe("GET /api/assessments", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("未授权返回 401", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(null)
    const req = new Request("http://localhost:3000/api/assessments?childId=child-1")
    const res = await GET(req)
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error.code).toBe("UNAUTHORIZED")
  })

  it("缺少 childId 返回 400", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    const req = new Request("http://localhost:3000/api/assessments")
    const res = await GET(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error.code).toBe("VALIDATION_ERROR")
  })

  it("成功返回评估列表", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    const mockAssessments = [
      { id: "assess-1", childId: "child-1", dimension: "PHYSICAL", score: 85 },
      { id: "assess-2", childId: "child-1", dimension: "LEARNING", score: 72 },
    ]
    vi.mocked(db.assessment.findMany).mockResolvedValue(mockAssessments as never)

    const req = new Request("http://localhost:3000/api/assessments?childId=child-1")
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.data).toHaveLength(2)
    expect(db.assessment.findMany).toHaveBeenCalledWith({
      where: { childId: "child-1" },
      orderBy: { createdAt: "desc" },
    })
  })
})

describe("POST /api/assessments", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("未授权返回 401", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(null)
    const req = new Request("http://localhost:3000/api/assessments", {
      method: "POST",
      body: JSON.stringify({
        childId: "child-1",
        dimension: "PHYSICAL",
        answers: [{ questionId: "PHY-001", score: 5 }],
      }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it("缺少参数返回 400", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    const req = new Request("http://localhost:3000/api/assessments", {
      method: "POST",
      body: JSON.stringify({ childId: "child-1" }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error.code).toBe("VALIDATION_ERROR")
  })

  it("孩子不属于当前用户返回 404", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    vi.mocked(db.child.findFirst).mockResolvedValue(null)

    const req = new Request("http://localhost:3000/api/assessments", {
      method: "POST",
      body: JSON.stringify({
        childId: "child-1",
        dimension: "PHYSICAL",
        answers: [{ questionId: "PHY-001", score: 5 }],
      }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error.code).toBe("NOT_FOUND")
  })

  it("成功提交评估并奖励 5 积分", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    vi.mocked(db.child.findFirst).mockResolvedValue({
      id: "child-1",
      userId: "user-1",
    } as never)

    const mockAssessment = {
      id: "assess-1",
      childId: "child-1",
      dimension: "PHYSICAL",
      score: 80,
      answers: JSON.stringify([{ questionId: "PHY-001", score: 5 }]),
      report: JSON.stringify({
        strengths: ["运动能力"],
        weaknesses: ["专注力"],
        suggestions: ["用舒尔特方格训练，从5分钟开始"],
      }),
    }
    vi.mocked(db.assessment.create).mockResolvedValue(mockAssessment as never)
    vi.mocked(db.point.create).mockResolvedValue({
      id: "point-1",
      childId: "child-1",
      amount: 5,
    } as never)

    const answers = [{ questionId: "PHY-001", score: 5 }]
    const req = new Request("http://localhost:3000/api/assessments", {
      method: "POST",
      body: JSON.stringify({
        childId: "child-1",
        dimension: "PHYSICAL",
        answers,
      }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)

    // 验证 calculateScore 和 generateReport 被调用
    expect(calculateScore).toHaveBeenCalledWith(answers)
    expect(generateReport).toHaveBeenCalledWith(
      answers,
      expect.arrayContaining([expect.objectContaining({ id: "PHY-001" })])
    )

    // 验证评估记录创建
    expect(db.assessment.create).toHaveBeenCalledWith({
      data: {
        childId: "child-1",
        dimension: "PHYSICAL",
        score: 80,
        answers: JSON.stringify(answers),
        report: JSON.stringify({
          strengths: ["运动能力"],
          weaknesses: ["专注力"],
          suggestions: ["用舒尔特方格训练，从5分钟开始"],
        }),
      },
    })

    // 验证奖励 5 积分
    expect(db.point.create).toHaveBeenCalledWith({
      data: {
        childId: "child-1",
        amount: 5,
        reason: "完成能力评估",
        source: "ASSESSMENT",
      },
    })
  })
})
