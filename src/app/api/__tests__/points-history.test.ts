import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    child: { findFirst: vi.fn() },
    point: { findMany: vi.fn(), count: vi.fn() },
  },
}))

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { GET } from "@/app/api/points/history/route"

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

describe("GET /api/points/history", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("未授权返回 401", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(null)
    const req = new Request("http://localhost:3000/api/points/history?childId=child-1")
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it("缺少 childId 返回 400", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    const req = new Request("http://localhost:3000/api/points/history")
    const res = await GET(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error.code).toBe("VALIDATION_ERROR")
  })

  it("孩子不属于当前用户返回 404", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    vi.mocked(db.child.findFirst).mockResolvedValue(null)
    const req = new Request("http://localhost:3000/api/points/history?childId=child-1")
    const res = await GET(req)
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error.code).toBe("NOT_FOUND")
  })

  it("默认分页参数返回积分历史", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    vi.mocked(db.child.findFirst).mockResolvedValue(mockChild)

    const mockItems = [
      { id: "p-1", amount: 5, reason: "签到", source: "CHECKIN", createdAt: new Date() },
    ]
    vi.mocked(db.point.findMany).mockResolvedValue(mockItems as never)
    vi.mocked(db.point.count).mockResolvedValue(1)

    const req = new Request("http://localhost:3000/api/points/history?childId=child-1")
    const res = await GET(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.items).toHaveLength(1)
    expect(data.data.items[0].id).toBe("p-1")
    expect(data.data.items[0].amount).toBe(5)
    expect(data.data.total).toBe(1)
    expect(data.data.page).toBe(1)
    expect(data.data.pageSize).toBe(20)
    expect(data.data.totalPages).toBe(1)

    // 验证默认分页参数传入 query
    expect(db.point.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 20,
      }),
    )
  })

  it("带 source 筛选参数", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    vi.mocked(db.child.findFirst).mockResolvedValue(mockChild)
    vi.mocked(db.point.findMany).mockResolvedValue([] as never)
    vi.mocked(db.point.count).mockResolvedValue(0)

    const req = new Request(
      "http://localhost:3000/api/points/history?childId=child-1&source=TASK_COMPLETE",
    )
    const res = await GET(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)

    expect(db.point.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { childId: "child-1", source: "TASK_COMPLETE" },
      }),
    )
  })

  it("非法 source 不加入筛选条件", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    vi.mocked(db.child.findFirst).mockResolvedValue(mockChild)
    vi.mocked(db.point.findMany).mockResolvedValue([] as never)
    vi.mocked(db.point.count).mockResolvedValue(0)

    const req = new Request(
      "http://localhost:3000/api/points/history?childId=child-1&source=INVALID",
    )
    await GET(req)

    expect(db.point.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { childId: "child-1" },
      }),
    )
  })

  it("分页边界保护 - page 最小为 1", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    vi.mocked(db.child.findFirst).mockResolvedValue(mockChild)
    vi.mocked(db.point.findMany).mockResolvedValue([] as never)
    vi.mocked(db.point.count).mockResolvedValue(0)

    const req = new Request(
      "http://localhost:3000/api/points/history?childId=child-1&page=0&pageSize=-5",
    )
    const res = await GET(req)
    const data = await res.json()

    expect(data.data.page).toBe(1)
    expect(data.data.pageSize).toBe(1)

    expect(db.point.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 1,
      }),
    )
  })

  it("分页边界保护 - pageSize 最大为 50", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    vi.mocked(db.child.findFirst).mockResolvedValue(mockChild)
    vi.mocked(db.point.findMany).mockResolvedValue([] as never)
    vi.mocked(db.point.count).mockResolvedValue(0)

    const req = new Request(
      "http://localhost:3000/api/points/history?childId=child-1&page=2&pageSize=100",
    )
    const res = await GET(req)
    const data = await res.json()

    expect(data.data.page).toBe(2)
    expect(data.data.pageSize).toBe(50)

    expect(db.point.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 50,
        take: 50,
      }),
    )
  })

  it("总页数计算正确", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    vi.mocked(db.child.findFirst).mockResolvedValue(mockChild)
    vi.mocked(db.point.findMany).mockResolvedValue([] as never)
    vi.mocked(db.point.count).mockResolvedValue(45)

    const req = new Request(
      "http://localhost:3000/api/points/history?childId=child-1&pageSize=20",
    )
    const res = await GET(req)
    const data = await res.json()

    expect(data.data.totalPages).toBe(3) // ceil(45/20) = 3
  })
})
