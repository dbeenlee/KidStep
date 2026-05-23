import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    child: { findFirst: vi.fn(), findUnique: vi.fn() },
    userAchievement: { findMany: vi.fn(), create: vi.fn() },
    achievement: { findUniqueOrThrow: vi.fn() },
    assessment: { count: vi.fn(), findMany: vi.fn(), findFirst: vi.fn() },
    checkin: { count: vi.fn(), findMany: vi.fn() },
    task: { count: vi.fn(), findMany: vi.fn() },
    milestone: { count: vi.fn() },
    favorite: { count: vi.fn() },
    point: { aggregate: vi.fn() },
  },
}))

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { POST } from "@/app/api/achievements/check/route"

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost:3000/api/achievements/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

const mockSession = { user: { id: "user-1" } }
const mockChild = { id: "child-1", userId: "user-1" }

describe("POST /api/achievements/check", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("未授权返回 401", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(null)
    const res = await POST(makeRequest({ childId: "child-1", event: "assessment" }))
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
    const res = await POST(makeRequest({ childId: "child-1", event: "assessment" }))
    expect(res.status).toBe(404)
  })

  describe("event=assessment", () => {
    beforeEach(() => {
      vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
      vi.mocked(db.child.findFirst).mockResolvedValue(mockChild as never)
    })

    it("首次评估解锁 first_assessment", async () => {
      // 无已解锁成就
      vi.mocked(db.userAchievement.findMany).mockResolvedValue([] as never)
      // 有 1 条评估记录
      vi.mocked(db.assessment.count).mockResolvedValue(1 as never)
      // 其他检查返回不满足条件
      vi.mocked(db.assessment.findMany).mockResolvedValue([{ dimension: "PHYSICAL" }] as never)
      vi.mocked(db.assessment.findFirst).mockResolvedValue(null as never)
      // 解锁逻辑
      vi.mocked(db.achievement.findUniqueOrThrow).mockResolvedValue({
        id: "ach-1",
        code: "first_assessment",
      } as never)
      vi.mocked(db.userAchievement.create).mockResolvedValue({
        id: "ua-1",
        unlockedAt: new Date("2026-05-23"),
      } as never)

      const res = await POST(makeRequest({ childId: "child-1", event: "assessment" }))
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.newAchievements).toHaveLength(1)
      expect(data.data.newAchievements[0].code).toBe("first_assessment")
    })

    it("4 个维度评估解锁 all_dimensions", async () => {
      vi.mocked(db.userAchievement.findMany).mockResolvedValue([] as never)
      // first_assessment 检查
      vi.mocked(db.assessment.count).mockResolvedValue(4 as never)
      // all_dimensions 检查：4 个不同维度
      vi.mocked(db.assessment.findMany).mockResolvedValue([
        { dimension: "PHYSICAL" },
        { dimension: "LIFE" },
        { dimension: "SOCIAL" },
        { dimension: "LEARNING" },
      ] as never)
      // score_excellent 不满足
      vi.mocked(db.assessment.findFirst).mockResolvedValue(null as never)

      vi.mocked(db.achievement.findUniqueOrThrow).mockResolvedValue({
        id: "ach-2",
        code: "all_dimensions",
      } as never)
      vi.mocked(db.userAchievement.create).mockResolvedValue({
        id: "ua-2",
        unlockedAt: new Date("2026-05-23"),
      } as never)

      const res = await POST(makeRequest({ childId: "child-1", event: "assessment" }))
      const data = await res.json()

      expect(res.status).toBe(200)
      // 应解锁 first_assessment + all_dimensions
      const codes = data.data.newAchievements.map((a: { code: string }) => a.code)
      expect(codes).toContain("first_assessment")
      expect(codes).toContain("all_dimensions")
    })

    it("单维度 >=90 解锁 score_excellent", async () => {
      vi.mocked(db.userAchievement.findMany).mockResolvedValue([] as never)
      vi.mocked(db.assessment.count).mockResolvedValue(1 as never)
      vi.mocked(db.assessment.findMany).mockResolvedValue([{ dimension: "PHYSICAL" }] as never)
      // score_excellent 满足
      vi.mocked(db.assessment.findFirst).mockResolvedValue({
        id: "assess-1",
        score: 95,
      } as never)

      vi.mocked(db.achievement.findUniqueOrThrow).mockResolvedValue({
        id: "ach-3",
        code: "score_excellent",
      } as never)
      vi.mocked(db.userAchievement.create).mockResolvedValue({
        id: "ua-3",
        unlockedAt: new Date("2026-05-23"),
      } as never)

      const res = await POST(makeRequest({ childId: "child-1", event: "assessment" }))
      const data = await res.json()

      const codes = data.data.newAchievements.map((a: { code: string }) => a.code)
      expect(codes).toContain("score_excellent")
    })

    it("已解锁的成就不重复解锁", async () => {
      // 已解锁 first_assessment
      vi.mocked(db.userAchievement.findMany).mockResolvedValue([
        { achievement: { code: "first_assessment" } },
      ] as never)
      vi.mocked(db.assessment.count).mockResolvedValue(1 as never)
      vi.mocked(db.assessment.findMany).mockResolvedValue([{ dimension: "PHYSICAL" }] as never)
      vi.mocked(db.assessment.findFirst).mockResolvedValue(null as never)

      const res = await POST(makeRequest({ childId: "child-1", event: "assessment" }))
      const data = await res.json()

      expect(data.data.newAchievements).toHaveLength(0)
      // 不应调用 create
      expect(db.userAchievement.create).not.toHaveBeenCalled()
    })
  })

  describe("event=checkin", () => {
    beforeEach(() => {
      vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
      vi.mocked(db.child.findFirst).mockResolvedValue(mockChild as never)
    })

    it("首次打卡解锁 first_checkin", async () => {
      vi.mocked(db.userAchievement.findMany).mockResolvedValue([] as never)
      vi.mocked(db.checkin.count).mockResolvedValue(1 as never)
      // 连续天数不足 3
      vi.mocked(db.checkin.findMany).mockResolvedValue([
        { date: new Date("2026-05-23") },
      ] as never)
      vi.mocked(db.milestone.count).mockResolvedValue(0 as never)

      vi.mocked(db.achievement.findUniqueOrThrow).mockResolvedValue({
        id: "ach-4",
        code: "first_checkin",
      } as never)
      vi.mocked(db.userAchievement.create).mockResolvedValue({
        id: "ua-4",
        unlockedAt: new Date("2026-05-23"),
      } as never)

      const res = await POST(makeRequest({ childId: "child-1", event: "checkin" }))
      const data = await res.json()

      expect(res.status).toBe(200)
      const codes = data.data.newAchievements.map((a: { code: string }) => a.code)
      expect(codes).toContain("first_checkin")
    })

    it("连续 3 天打卡解锁 streak_3", async () => {
      vi.mocked(db.userAchievement.findMany).mockResolvedValue([] as never)
      vi.mocked(db.checkin.count).mockResolvedValue(3 as never)
      // 连续 3 天打卡
      vi.mocked(db.checkin.findMany).mockResolvedValue([
        { date: new Date("2026-05-23") },
        { date: new Date("2026-05-22") },
        { date: new Date("2026-05-21") },
      ] as never)
      vi.mocked(db.milestone.count).mockResolvedValue(0 as never)

      vi.mocked(db.achievement.findUniqueOrThrow).mockResolvedValue({
        id: "ach-5",
        code: "streak_3",
      } as never)
      vi.mocked(db.userAchievement.create).mockResolvedValue({
        id: "ua-5",
        unlockedAt: new Date("2026-05-23"),
      } as never)

      const res = await POST(makeRequest({ childId: "child-1", event: "checkin" }))
      const data = await res.json()

      const codes = data.data.newAchievements.map((a: { code: string }) => a.code)
      expect(codes).toContain("first_checkin")
      expect(codes).toContain("streak_3")
    })
  })

  describe("event=task_complete", () => {
    beforeEach(() => {
      vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
      vi.mocked(db.child.findFirst).mockResolvedValue(mockChild as never)
    })

    it("完成 1 个任务解锁 first_task", async () => {
      vi.mocked(db.userAchievement.findMany).mockResolvedValue([] as never)
      vi.mocked(db.task.count).mockResolvedValue(1 as never)
      // 任务连续天数不足 3
      vi.mocked(db.task.findMany).mockResolvedValue([
        { scheduledDate: new Date("2026-05-23") },
      ] as never)
      vi.mocked(db.point.aggregate).mockResolvedValue({
        _sum: { amount: 5 },
      } as never)

      vi.mocked(db.achievement.findUniqueOrThrow).mockResolvedValue({
        id: "ach-6",
        code: "first_task",
      } as never)
      vi.mocked(db.userAchievement.create).mockResolvedValue({
        id: "ua-6",
        unlockedAt: new Date("2026-05-23"),
      } as never)

      const res = await POST(makeRequest({ childId: "child-1", event: "task_complete" }))
      const data = await res.json()

      expect(res.status).toBe(200)
      const codes = data.data.newAchievements.map((a: { code: string }) => a.code)
      expect(codes).toContain("first_task")
    })

    it("完成 10 个任务解锁 tasks_10", async () => {
      vi.mocked(db.userAchievement.findMany).mockResolvedValue([] as never)
      vi.mocked(db.task.count).mockResolvedValue(10 as never)
      vi.mocked(db.task.findMany).mockResolvedValue([] as never)
      vi.mocked(db.point.aggregate).mockResolvedValue({
        _sum: { amount: 50 },
      } as never)

      vi.mocked(db.achievement.findUniqueOrThrow).mockResolvedValue({
        id: "ach-7",
        code: "tasks_10",
      } as never)
      vi.mocked(db.userAchievement.create).mockResolvedValue({
        id: "ua-7",
        unlockedAt: new Date("2026-05-23"),
      } as never)

      const res = await POST(makeRequest({ childId: "child-1", event: "task_complete" }))
      const data = await res.json()

      const codes = data.data.newAchievements.map((a: { code: string }) => a.code)
      expect(codes).toContain("first_task")
      expect(codes).toContain("tasks_10")
    })
  })

  describe("event=favorite", () => {
    beforeEach(() => {
      vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
      vi.mocked(db.child.findFirst).mockResolvedValue(mockChild as never)
    })

    it("首次收藏解锁 first_favorite", async () => {
      vi.mocked(db.child.findUnique).mockResolvedValue({
        userId: "user-1",
      } as never)
      vi.mocked(db.userAchievement.findMany).mockResolvedValue([] as never)
      vi.mocked(db.favorite.count).mockResolvedValue(1 as never)

      vi.mocked(db.achievement.findUniqueOrThrow).mockResolvedValue({
        id: "ach-8",
        code: "first_favorite",
      } as never)
      vi.mocked(db.userAchievement.create).mockResolvedValue({
        id: "ua-8",
        unlockedAt: new Date("2026-05-23"),
      } as never)

      const res = await POST(makeRequest({ childId: "child-1", event: "favorite" }))
      const data = await res.json()

      expect(res.status).toBe(200)
      const codes = data.data.newAchievements.map((a: { code: string }) => a.code)
      expect(codes).toContain("first_favorite")
    })
  })

  it("成就检查异常返回 500", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    vi.mocked(db.child.findFirst).mockResolvedValue(mockChild as never)
    // 模拟 findMany 抛异常
    vi.mocked(db.userAchievement.findMany).mockRejectedValue(new Error("DB error"))

    const res = await POST(makeRequest({ childId: "child-1", event: "assessment" }))
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error.code).toBe("INTERNAL_ERROR")
    consoleSpy.mockRestore()
  })
})
