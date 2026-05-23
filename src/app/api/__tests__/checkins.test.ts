import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    child: { findFirst: vi.fn() },
    checkin: { create: vi.fn(), findMany: vi.fn() },
    point: { create: vi.fn() },
  },
}))

vi.mock("@/lib/utils", () => ({
  randomItem: vi.fn(() => "太棒了，今天又完成了一项！"),
}))

vi.mock("@/lib/streakCalculator", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/streakCalculator")>()
  return {
    calculateStreak: vi.fn(actual.calculateStreak),
    calculateCheckinPoints: vi.fn(actual.calculateCheckinPoints),
  }
})

vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response()))

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { POST } from "@/app/api/checkins/route"

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost:3000/api/checkins", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

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

describe("POST /api/checkins", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("未授权返回 401", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(null)
    const res = await POST(makeRequest({
      childId: "child-1",
      type: "EXERCISE",
      itemName: "跳绳",
    }))
    expect(res.status).toBe(401)
  })

  it("参数缺失返回 400", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    const res = await POST(makeRequest({ childId: "child-1" }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error.code).toBe("VALIDATION_ERROR")
  })

  it("孩子不存在返回 404", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    vi.mocked(db.child.findFirst).mockResolvedValue(null)
    const res = await POST(makeRequest({
      childId: "child-1",
      type: "EXERCISE",
      itemName: "跳绳",
    }))
    expect(res.status).toBe(404)
  })

  it("成功打卡返回 checkin + point + encouragement + streak", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    vi.mocked(db.child.findFirst).mockResolvedValue(mockChild as never)

    const mockCheckin = {
      id: "checkin-1",
      childId: "child-1",
      date: new Date("2026-05-23"),
      type: "EXERCISE",
      itemName: "跳绳",
      note: null,
    }
    vi.mocked(db.checkin.create).mockResolvedValue(
      mockCheckin as never
    )

    // 第一次打卡，无历史记录 → streak=0
    vi.mocked(db.checkin.findMany).mockResolvedValue([])

    const mockPoint = {
      id: "point-1",
      childId: "child-1",
      amount: 1,
      reason: "打卡 +1",
      source: "CHECKIN",
    }
    vi.mocked(db.point.create).mockResolvedValue(
      mockPoint as never
    )

    const res = await POST(makeRequest({
      childId: "child-1",
      type: "EXERCISE",
      itemName: "跳绳",
    }))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.checkin).toBeDefined()
    expect(data.data.point).toBeDefined()
    expect(data.data.encouragement).toBe("太棒了，今天又完成了一项！")
    expect(data.data.streak).toBe(0)
  })

  it("连续打卡积分正确（基础 1 + 连续奖励）", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    vi.mocked(db.child.findFirst).mockResolvedValue(mockChild as never)

    vi.mocked(db.checkin.create).mockResolvedValue({
      id: "checkin-2",
    } as never)

    // 连续 3 天打卡 → streak=3
    vi.mocked(db.checkin.findMany).mockResolvedValue([
      { date: new Date("2026-05-23") },
      { date: new Date("2026-05-22") },
      { date: new Date("2026-05-21") },
    ] as never)

    const mockPoint = {
      id: "point-2",
      amount: 4,
      reason: "打卡 +1，连续3天 +3",
      source: "STREAK",
    }
    vi.mocked(db.point.create).mockResolvedValue(
      mockPoint as never
    )

    const res = await POST(makeRequest({
      childId: "child-1",
      type: "EXERCISE",
      itemName: "跳绳",
    }))
    const data = await res.json()

    expect(res.status).toBe(200)
    // streak=3 → base=1 + bonus=3 = 4
    expect(data.data.point.amount).toBe(4)
    expect(data.data.streak).toBe(3)
  })

  it("连续打卡奖励上限 7", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    vi.mocked(db.child.findFirst).mockResolvedValue(mockChild as never)

    vi.mocked(db.checkin.create).mockResolvedValue({
      id: "checkin-3",
    } as never)

    // 连续 10 天打卡
    vi.mocked(db.checkin.findMany).mockResolvedValue(
      Array.from({ length: 10 }, (_, i) => ({
        date: new Date(`2026-05-${23 - i}`),
      })) as never
    )

    const mockPoint = {
      id: "point-3",
      amount: 8, // base=1 + bonus 上限 7
      reason: "打卡 +1，连续10天 +7",
      source: "STREAK",
    }
    vi.mocked(db.point.create).mockResolvedValue(
      mockPoint as never
    )

    const res = await POST(makeRequest({
      childId: "child-1",
      type: "READING",
      itemName: "读绘本",
    }))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.data.point.amount).toBe(8) // 上限
  })
})
