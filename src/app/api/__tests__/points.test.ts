import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    child: { findFirst: vi.fn() },
    point: { aggregate: vi.fn(), findMany: vi.fn() },
  },
}))

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { GET } from "@/app/api/points/route"

const mockSession = { user: { id: "user-1" } }
const mockChild = { id: "child-1", userId: "user-1", name: "小明" }

describe("GET /api/points", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("未授权返回 401", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(null)
    const req = new Request("http://localhost:3000/api/points?childId=child-1")
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it("缺少 childId 返回 400", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    const req = new Request("http://localhost:3000/api/points")
    const res = await GET(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error.code).toBe("VALIDATION_ERROR")
  })

  it("孩子不属于当前用户返回 404", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    vi.mocked(db.child.findFirst).mockResolvedValue(null)
    const req = new Request("http://localhost:3000/api/points?childId=child-1")
    const res = await GET(req)
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error.code).toBe("NOT_FOUND")
  })

  it("成功返回积分概览", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    vi.mocked(db.child.findFirst).mockResolvedValue(mockChild)

    const mockHistory = [
      { id: "p-1", amount: 5, reason: "签到", source: "CHECKIN", createdAt: new Date("2026-05-23") },
    ]

    // 第1次 aggregate = 总积分
    vi.mocked(db.point.aggregate)
      .mockResolvedValueOnce({ _sum: { amount: 100 } } as never)
      // 第2次 aggregate = 本月
      .mockResolvedValueOnce({ _sum: { amount: 30 } } as never)
      // 第3次 aggregate = 本周
      .mockResolvedValueOnce({ _sum: { amount: 10 } } as never)

    vi.mocked(db.point.findMany).mockResolvedValue(mockHistory as never)

    const req = new Request("http://localhost:3000/api/points?childId=child-1")
    const res = await GET(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.totalPoints).toBe(100)
    expect(data.data.totalEarned).toBe(100)
    expect(data.data.monthTotal).toBe(30)
    expect(data.data.thisWeekTotal).toBe(10)
    expect(data.data.history).toHaveLength(1)
    expect(data.data.history[0].id).toBe("p-1")
    expect(data.data.history[0].amount).toBe(5)
  })

  it("积分为空时返回 0", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    vi.mocked(db.child.findFirst).mockResolvedValue(mockChild)

    vi.mocked(db.point.aggregate)
      .mockResolvedValueOnce({ _sum: { amount: null } } as never)
      .mockResolvedValueOnce({ _sum: { amount: null } } as never)
      .mockResolvedValueOnce({ _sum: { amount: null } } as never)

    vi.mocked(db.point.findMany).mockResolvedValue([] as never)

    const req = new Request("http://localhost:3000/api/points?childId=child-1")
    const res = await GET(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.data.totalPoints).toBe(0)
    expect(data.data.monthTotal).toBe(0)
    expect(data.data.thisWeekTotal).toBe(0)
  })
})
