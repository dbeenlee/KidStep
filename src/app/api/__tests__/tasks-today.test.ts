import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    child: { findFirst: vi.fn() },
    task: { findMany: vi.fn(), createMany: vi.fn() },
    assessment: { findMany: vi.fn() },
  },
}))

vi.mock("dayjs", () => {
  const mockDayjs = vi.fn(() => ({
    startOf: vi.fn().mockReturnThis(),
    toDate: vi.fn(() => new Date("2026-05-23T00:00:00.000Z")),
    subtract: vi.fn().mockReturnThis(),
  }))
  return { default: mockDayjs }
})

vi.mock("@/lib/phaseCalculator", () => ({
  getCurrentPhase: vi.fn(),
}))

vi.mock("@/lib/taskGenerator", () => ({
  generateDailyTasks: vi.fn(),
  findWeakDimensions: vi.fn(),
}))

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getCurrentPhase } from "@/lib/phaseCalculator"
import { generateDailyTasks, findWeakDimensions } from "@/lib/taskGenerator"
import { GET } from "@/app/api/tasks/today/route"

const mockSession = { user: { id: "user-1" } }
const mockChild = {
  id: "child-1",
  userId: "user-1",
  name: "小明",
  birthday: new Date("2020-06-15"),
  createdAt: new Date(),
  updatedAt: new Date(),
  gender: "male",
  targetSchool: null,
}

describe("GET /api/tasks/today", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("未授权返回 401", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(null)

    const req = new Request("http://localhost:3000/api/tasks/today?childId=child-1")
    const res = await GET(req)
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error.code).toBe("UNAUTHORIZED")
  })

  it("缺少 childId 返回 400", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)

    const req = new Request("http://localhost:3000/api/tasks/today")
    const res = await GET(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error.code).toBe("VALIDATION_ERROR")
  })

  it("孩子不属于当前用户返回 404", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    vi.mocked(db.child.findFirst).mockResolvedValue(null)

    const req = new Request("http://localhost:3000/api/tasks/today?childId=child-1")
    const res = await GET(req)
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error.code).toBe("NOT_FOUND")
  })

  it("有今日任务直接返回", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    vi.mocked(db.child.findFirst).mockResolvedValue(mockChild)

    const mockTasks = [
      { id: "task-1", childId: "child-1", title: "练习写字", status: "PENDING", createdAt: new Date(), updatedAt: new Date(), phase: "PHASE_1", taskType: "HABIT", templateId: "tpl-1", description: null, duration: 10, scheduledDate: new Date(), completedAt: null },
      { id: "task-2", childId: "child-1", title: "整理书包", status: "PENDING", createdAt: new Date(), updatedAt: new Date(), phase: "PHASE_1", taskType: "LIFE", templateId: "tpl-2", description: null, duration: 15, scheduledDate: new Date(), completedAt: null },
    ]
    vi.mocked(db.task.findMany).mockResolvedValue(mockTasks)

    const req = new Request("http://localhost:3000/api/tasks/today?childId=child-1")
    const res = await GET(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveLength(2)
    expect(data.data[0].title).toBe("练习写字")
  })

  it("无任务时触发智能生成并返回新任务", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    vi.mocked(db.child.findFirst).mockResolvedValue(mockChild)
    vi.mocked(getCurrentPhase).mockReturnValue("PHASE_1")

    // 第一次 findMany 返回空（今日无任务），后续查询返回数据
    const mockAssessments = [
      { dimension: "LIFE", score: 45 },
    ]
    const mockRecentTasks = [
      { templateId: "recent-template-1" },
    ]
    const mockGeneratedTasks = [
      {
        childId: "child-1",
        phase: "PHASE_1" as const,
        taskType: "HABIT" as const,
        templateId: "tpl-1",
        title: "整理玩具",
        description: "把玩具放回原位",
        duration: 10,
        scheduledDate: new Date("2026-05-23T00:00:00.000Z"),
      },
    ]
    const mockCreatedTasks = [
      {
        id: "task-new-1",
        childId: "child-1",
        title: "整理玩具",
        status: "PENDING",
        scheduledDate: new Date("2026-05-23T00:00:00.000Z"),
      },
    ]

    vi.mocked(findWeakDimensions).mockReturnValue(["LIFE"])
    vi.mocked(generateDailyTasks).mockReturnValue(mockGeneratedTasks)

    // findMany 被调用多次：第一次空 → 并发检查空 → 创建后返回结果
    vi.mocked(db.task.findMany)
      .mockResolvedValueOnce([])  // 今日任务
      .mockResolvedValueOnce([])  // 并发双重检查
      .mockResolvedValueOnce(mockRecentTasks as never)  // 近 7 天任务
      .mockResolvedValueOnce(mockCreatedTasks as never)  // 创建后查询

    vi.mocked(db.assessment.findMany).mockResolvedValue(mockAssessments as never)
    vi.mocked(db.task.createMany).mockResolvedValue({ count: 1 })

    const req = new Request("http://localhost:3000/api/tasks/today?childId=child-1")
    const res = await GET(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveLength(1)
    expect(data.data[0].title).toBe("整理玩具")

    // 验证生成流程被正确调用
    expect(getCurrentPhase).toHaveBeenCalledWith(mockChild.birthday)
    expect(findWeakDimensions).toHaveBeenCalledWith(mockAssessments)
    expect(generateDailyTasks).toHaveBeenCalledWith({
      childId: "child-1",
      phase: "PHASE_1",
      weakDimensions: ["LIFE"],
      recentTemplateIds: ["recent-template-1"],
      existingTemplateIds: [],
    })
    expect(db.task.createMany).toHaveBeenCalledWith({ data: mockGeneratedTasks })
  })

  it("无任务且无阶段时不生成任务，直接返回空数组", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    vi.mocked(db.child.findFirst).mockResolvedValue(mockChild)
    vi.mocked(getCurrentPhase).mockReturnValue(null)
    vi.mocked(db.task.findMany).mockResolvedValue([])

    const req = new Request("http://localhost:3000/api/tasks/today?childId=child-1")
    const res = await GET(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveLength(0)
    expect(generateDailyTasks).not.toHaveBeenCalled()
  })
})
