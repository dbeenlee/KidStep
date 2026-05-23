import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    task: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}))

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { PATCH } from "@/app/api/tasks/[id]/skip/route"

const mockSession = { user: { id: "user-1" } }

describe("PATCH /api/tasks/:id/skip", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("未授权返回 401", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(null)

    const req = new Request("http://localhost:3000/api/tasks/task-1/skip", {
      method: "PATCH",
    })
    const res = await PATCH(req, { params: { id: "task-1" } })
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error.code).toBe("UNAUTHORIZED")
  })

  it("任务不存在返回 404", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    vi.mocked(db.task.findFirst).mockResolvedValue(null)

    const req = new Request("http://localhost:3000/api/tasks/task-1/skip", {
      method: "PATCH",
    })
    const res = await PATCH(req, { params: { id: "task-1" } })
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error.code).toBe("NOT_FOUND")
  })

  it("状态非 PENDING 返回 400", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    vi.mocked(db.task.findFirst).mockResolvedValue({
      id: "task-1",
      childId: "child-1",
      title: "测试任务",
      status: "COMPLETED",
    })

    const req = new Request("http://localhost:3000/api/tasks/task-1/skip", {
      method: "PATCH",
    })
    const res = await PATCH(req, { params: { id: "task-1" } })
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error.code).toBe("INVALID_STATUS")
  })

  it("成功跳过 PENDING 任务返回更新后的任务", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)

    const mockTask = {
      id: "task-1",
      childId: "child-1",
      title: "练习写字",
      status: "PENDING",
    }
    const mockUpdatedTask = {
      ...mockTask,
      status: "SKIPPED",
    }

    vi.mocked(db.task.findFirst).mockResolvedValue(mockTask)
    vi.mocked(db.task.update).mockResolvedValue(mockUpdatedTask)

    const req = new Request("http://localhost:3000/api/tasks/task-1/skip", {
      method: "PATCH",
    })
    const res = await PATCH(req, { params: { id: "task-1" } })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.task.status).toBe("SKIPPED")
    expect(db.task.update).toHaveBeenCalledWith({
      where: { id: "task-1" },
      data: { status: "SKIPPED" },
    })
  })
})
