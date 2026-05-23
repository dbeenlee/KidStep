import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    child: { findFirst: vi.fn() },
    task: { findMany: vi.fn() },
  },
}))

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { GET } from "@/app/api/checkins/calendar/route"

const mockSession = { user: { id: "user-1" } }
const mockChild = { id: "child-1", userId: "user-1" }

describe("GET /api/checkins/calendar", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("未授权返回 401", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(null)
    const req = new Request(
      "http://localhost:3000/api/checkins/calendar?childId=child-1&month=2026-05"
    )
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it("参数缺失返回 400", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    const req = new Request(
      "http://localhost:3000/api/checkins/calendar?childId=child-1"
    )
    const res = await GET(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error.code).toBe("VALIDATION_ERROR")
  })

  it("孩子不存在返回 404", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    vi.mocked(db.child.findFirst).mockResolvedValue(null)
    const req = new Request(
      "http://localhost:3000/api/checkins/calendar?childId=child-1&month=2026-05"
    )
    const res = await GET(req)
    expect(res.status).toBe(404)
  })

  it("空月份（无任务）全月 noTask", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    vi.mocked(db.child.findFirst).mockResolvedValue(mockChild as never)
    vi.mocked(db.task.findMany).mockResolvedValue([])

    const req = new Request(
      "http://localhost:3000/api/checkins/calendar?childId=child-1&month=2026-05"
    )
    const res = await GET(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    // 2026-05 有 31 天
    expect(data.data).toHaveLength(31)
    // 全部为 noTask
    expect(data.data.every((d: { status: string }) => d.status === "noTask")).toBe(true)
  })

  it("某天 3 个任务全完成 → full", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    vi.mocked(db.child.findFirst).mockResolvedValue(mockChild as never)

    // 5 月 10 日 3 个任务全部完成
    vi.mocked(db.task.findMany).mockResolvedValue([
      { scheduledDate: new Date("2026-05-10"), status: "COMPLETED" },
      { scheduledDate: new Date("2026-05-10"), status: "COMPLETED" },
      { scheduledDate: new Date("2026-05-10"), status: "COMPLETED" },
    ] as never)

    const req = new Request(
      "http://localhost:3000/api/checkins/calendar?childId=child-1&month=2026-05"
    )
    const res = await GET(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    const day10 = data.data.find((d: { date: string }) => d.date === "2026-05-10")
    expect(day10.status).toBe("full")
    expect(day10.completedCount).toBe(3)
    expect(day10.totalCount).toBe(3)
  })

  it("某天 2/3 完成 → partial", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    vi.mocked(db.child.findFirst).mockResolvedValue(mockChild as never)

    vi.mocked(db.task.findMany).mockResolvedValue([
      { scheduledDate: new Date("2026-05-15"), status: "COMPLETED" },
      { scheduledDate: new Date("2026-05-15"), status: "COMPLETED" },
      { scheduledDate: new Date("2026-05-15"), status: "PENDING" },
    ] as never)

    const req = new Request(
      "http://localhost:3000/api/checkins/calendar?childId=child-1&month=2026-05"
    )
    const res = await GET(req)
    const data = await res.json()

    const day15 = data.data.find((d: { date: string }) => d.date === "2026-05-15")
    expect(day15.status).toBe("partial")
    expect(day15.completedCount).toBe(2)
    expect(day15.totalCount).toBe(3)
  })

  it("某天有任务但未完成 → none", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    vi.mocked(db.child.findFirst).mockResolvedValue(mockChild as never)

    vi.mocked(db.task.findMany).mockResolvedValue([
      { scheduledDate: new Date("2026-05-20"), status: "PENDING" },
      { scheduledDate: new Date("2026-05-20"), status: "PENDING" },
    ] as never)

    const req = new Request(
      "http://localhost:3000/api/checkins/calendar?childId=child-1&month=2026-05"
    )
    const res = await GET(req)
    const data = await res.json()

    const day20 = data.data.find((d: { date: string }) => d.date === "2026-05-20")
    expect(day20.status).toBe("none")
    expect(day20.completedCount).toBe(0)
    expect(day20.totalCount).toBe(2)
  })

  it("混合状态：不同天有不同的完成状态", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    vi.mocked(db.child.findFirst).mockResolvedValue(mockChild as never)

    vi.mocked(db.task.findMany).mockResolvedValue([
      // 5月5日：全部完成
      { scheduledDate: new Date("2026-05-05"), status: "COMPLETED" },
      { scheduledDate: new Date("2026-05-05"), status: "COMPLETED" },
      // 5月6日：部分完成
      { scheduledDate: new Date("2026-05-06"), status: "COMPLETED" },
      { scheduledDate: new Date("2026-05-06"), status: "PENDING" },
      // 5月7日：未完成
      { scheduledDate: new Date("2026-05-07"), status: "PENDING" },
    ] as never)

    const req = new Request(
      "http://localhost:3000/api/checkins/calendar?childId=child-1&month=2026-05"
    )
    const res = await GET(req)
    const data = await res.json()

    const day5 = data.data.find((d: { date: string }) => d.date === "2026-05-05")
    expect(day5.status).toBe("full")

    const day6 = data.data.find((d: { date: string }) => d.date === "2026-05-06")
    expect(day6.status).toBe("partial")

    const day7 = data.data.find((d: { date: string }) => d.date === "2026-05-07")
    expect(day7.status).toBe("none")
  })
})
