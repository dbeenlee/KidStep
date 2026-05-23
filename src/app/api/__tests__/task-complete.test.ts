import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    $transaction: vi.fn(),
  },
}))

vi.mock("@/lib/utils", () => ({
  randomItem: vi.fn(() => "任务完成！给自己点个赞！"),
}))

vi.mock("@/lib/streakCalculator", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/streakCalculator")>()
  return {
    calculateStreak: vi.fn(actual.calculateStreak),
    calculateTaskPoints: vi.fn(actual.calculateTaskPoints),
  }
})

vi.mock("node:crypto", () => ({
  default: { randomUUID: vi.fn(() => "mock-uuid") },
  randomUUID: vi.fn(() => "mock-uuid"),
}))

// 阻止 fetch 调用成就检查接口
vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response()))

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { PATCH } from "@/app/api/tasks/[id]/complete/route"

const mockSession = { user: { id: "user-1" } }

describe("PATCH /api/tasks/:id/complete", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("未授权返回 401", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(null)
    const req = new Request("http://localhost:3000/api/tasks/task-1/complete", {
      method: "PATCH",
    })
    const res = await PATCH(req, { params: { id: "task-1" } })
    expect(res.status).toBe(401)
  })

  it("任务不存在返回 404", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    // $transaction 内部返回 NOT_FOUND
    vi.mocked(db.$transaction).mockImplementation(async (fn) => {
      const tx = {
        task: {
          findFirst: vi.fn().mockResolvedValue(null),
          update: vi.fn(),
          findMany: vi.fn(),
        },
        point: { create: vi.fn() },
      }
      return fn(tx as never)
    })

    const req = new Request("http://localhost:3000/api/tasks/task-1/complete", {
      method: "PATCH",
    })
    const res = await PATCH(req, { params: { id: "task-1" } })
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error.code).toBe("NOT_FOUND")
  })

  it("任务状态非 PENDING 返回 400", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    vi.mocked(db.$transaction).mockImplementation(async (fn) => {
      const tx = {
        task: {
          findFirst: vi.fn().mockResolvedValue({
            id: "task-1",
            childId: "child-1",
            title: "测试任务",
            status: "COMPLETED",
          }),
          update: vi.fn(),
          findMany: vi.fn(),
        },
        point: { create: vi.fn() },
      }
      return fn(tx as never)
    })

    const req = new Request("http://localhost:3000/api/tasks/task-1/complete", {
      method: "PATCH",
    })
    const res = await PATCH(req, { params: { id: "task-1" } })
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error.code).toBe("INVALID_STATUS")
  })

  it("成功完成 PENDING 任务返回 task + point + encouragement", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)

    const mockTask = {
      id: "task-1",
      childId: "child-1",
      title: "练习写字",
      status: "PENDING",
    }
    const mockUpdatedTask = {
      ...mockTask,
      status: "COMPLETED",
      completedAt: new Date("2026-05-23"),
    }
    const mockPoint = {
      id: "point-1",
      childId: "child-1",
      amount: 2,
      reason: "完成任务「练习写字」+2",
      source: "TASK_COMPLETE",
    }

    vi.mocked(db.$transaction).mockImplementation(async (fn) => {
      const tx = {
        task: {
          findFirst: vi.fn().mockResolvedValue(mockTask),
          update: vi.fn().mockResolvedValue(mockUpdatedTask),
          findMany: vi.fn().mockResolvedValue([]),
        },
        point: { create: vi.fn().mockResolvedValue(mockPoint) },
      }
      return fn(tx as never)
    })

    const req = new Request("http://localhost:3000/api/tasks/task-1/complete", {
      method: "PATCH",
    })
    const res = await PATCH(req, { params: { id: "task-1" } })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.task.status).toBe("COMPLETED")
    expect(data.data.point).toBeDefined()
    expect(data.data.encouragement).toBe("任务完成！给自己点个赞！")
  })

  it("连续完成任务积分计算正确（基础 2 + 连续奖励）", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)

    const mockTask = {
      id: "task-1",
      childId: "child-1",
      title: "练习写字",
      status: "PENDING",
    }
    const mockUpdatedTask = { ...mockTask, status: "COMPLETED", completedAt: new Date() }
    const mockPoint = { id: "point-1", amount: 4 }

    vi.mocked(db.$transaction).mockImplementation(async (fn) => {
      const tx = {
        task: {
          findFirst: vi.fn().mockResolvedValue(mockTask),
          update: vi.fn().mockResolvedValue(mockUpdatedTask),
          // 连续 2 天完成任务 → streak=2
          findMany: vi.fn().mockResolvedValue([
            { scheduledDate: new Date("2026-05-23") },
            { scheduledDate: new Date("2026-05-22") },
          ]),
        },
        point: { create: vi.fn().mockResolvedValue(mockPoint) },
      }
      return fn(tx as never)
    })

    const req = new Request("http://localhost:3000/api/tasks/task-1/complete", {
      method: "PATCH",
    })
    const res = await PATCH(req, { params: { id: "task-1" } })
    const data = await res.json()

    expect(res.status).toBe(200)
    // streak=2 → base=2 + bonus=2 = 4
    expect(data.data.point.amount).toBe(4)
  })

  it("事务被正确调用", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    const mockTask = {
      id: "task-1",
      childId: "child-1",
      title: "测试",
      status: "PENDING",
    }

    vi.mocked(db.$transaction).mockImplementation(async (fn) => {
      const tx = {
        task: {
          findFirst: vi.fn().mockResolvedValue(mockTask),
          update: vi.fn().mockResolvedValue({ ...mockTask, status: "COMPLETED" }),
          findMany: vi.fn().mockResolvedValue([]),
        },
        point: { create: vi.fn().mockResolvedValue({ id: "p-1", amount: 2 }) },
      }
      return fn(tx as never)
    })

    const req = new Request("http://localhost:3000/api/tasks/task-1/complete", {
      method: "PATCH",
    })
    await PATCH(req, { params: { id: "task-1" } })

    expect(db.$transaction).toHaveBeenCalledTimes(1)
    expect(db.$transaction).toHaveBeenCalledWith(expect.any(Function))
  })
})
