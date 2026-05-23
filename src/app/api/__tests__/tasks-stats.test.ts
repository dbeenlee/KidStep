import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    child: { findFirst: vi.fn() },
    task: {
      count: vi.fn(),
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { GET } from "@/app/api/tasks/stats/route"

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

describe("GET /api/tasks/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("未授权返回 401", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(null)

    const req = new Request("http://localhost:3000/api/tasks/stats?childId=child-1")
    const res = await GET(req)
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error.code).toBe("UNAUTHORIZED")
  })

  it("缺少 childId 返回 400", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)

    const req = new Request("http://localhost:3000/api/tasks/stats")
    const res = await GET(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error.code).toBe("VALIDATION_ERROR")
  })

  it("孩子不属于当前用户返回 404", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    vi.mocked(db.child.findFirst).mockResolvedValue(null)

    const req = new Request("http://localhost:3000/api/tasks/stats?childId=child-1")
    const res = await GET(req)
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error.code).toBe("NOT_FOUND")
  })

  it("成功返回统计数据", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    vi.mocked(db.child.findFirst).mockResolvedValue(mockChild)

    // count 查询：total=10, completed=6, skipped=2, pending=2
    vi.mocked(db.task.count)
      .mockResolvedValueOnce(10)  // total
      .mockResolvedValueOnce(6)   // completed
      .mockResolvedValueOnce(2)   // skipped
      .mockResolvedValueOnce(2)   // pending

    // groupBy 查询
    vi.mocked(db.task.groupBy)
      .mockResolvedValueOnce([    // 按类型分组
        { taskType: "HABIT", _count: { id: 4 } },
        { taskType: "ABILITY", _count: { id: 3 } },
        { taskType: "BONDING", _count: { id: 3 } },
      ] as never)
      .mockResolvedValueOnce([    // 按类型分组（已完成）
        { taskType: "HABIT", _count: { id: 3 } },
        { taskType: "ABILITY", _count: { id: 2 } },
        { taskType: "BONDING", _count: { id: 1 } },
      ] as never)

    // 最近 30 天任务
    vi.mocked(db.task.findMany).mockResolvedValue([
      { scheduledDate: new Date("2026-05-23"), status: "COMPLETED" },
      { scheduledDate: new Date("2026-05-23"), status: "COMPLETED" },
      { scheduledDate: new Date("2026-05-22"), status: "PENDING" },
    ] as never)

    const req = new Request("http://localhost:3000/api/tasks/stats?childId=child-1")
    const res = await GET(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)

    // 验证汇总数据
    expect(data.data.total).toBe(10)
    expect(data.data.completed).toBe(6)
    expect(data.data.skipped).toBe(2)
    expect(data.data.pending).toBe(2)
    expect(data.data.completionRate).toBe(60)

    // 验证类型分布
    expect(data.data.typeDistribution).toHaveLength(3)
    expect(data.data.typeDistribution[0]).toEqual({
      type: "HABIT",
      count: 4,
      completed: 3,
    })

    // 验证每日趋势
    expect(data.data.dailyTrend).toHaveLength(30)
  })

  it("无数据时 completionRate 为 0", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    vi.mocked(db.child.findFirst).mockResolvedValue(mockChild)

    vi.mocked(db.task.count).mockResolvedValue(0)
    vi.mocked(db.task.groupBy).mockResolvedValue([] as never)
    vi.mocked(db.task.findMany).mockResolvedValue([])

    const req = new Request("http://localhost:3000/api/tasks/stats?childId=child-1")
    const res = await GET(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.data.total).toBe(0)
    expect(data.data.completionRate).toBe(0)
    expect(data.data.typeDistribution).toHaveLength(0)
    expect(data.data.dailyTrend).toHaveLength(30)
  })
})
