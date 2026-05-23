import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    child: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { GET, POST } from "@/app/api/children/route"
import { PUT, DELETE } from "@/app/api/children/[id]/route"

const mockSession = { user: { id: "user-1" } }

describe("GET /api/children", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("未授权返回 401", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.error.code).toBe("UNAUTHORIZED")
  })

  it("成功返回孩子列表", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    const mockChildren = [
      { id: "child-1", name: "小明", userId: "user-1" },
      { id: "child-2", name: "小红", userId: "user-1" },
    ]
    vi.mocked(db.child.findMany).mockResolvedValue(mockChildren as never)

    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.data).toHaveLength(2)
    expect(db.child.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: { createdAt: "asc" },
    })
  })
})

describe("POST /api/children", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("未授权返回 401", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(null)
    const req = new Request("http://localhost:3000/api/children", {
      method: "POST",
      body: JSON.stringify({ name: "小明", birthday: "2020-01-01" }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it("缺少 name 返回 400", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    const req = new Request("http://localhost:3000/api/children", {
      method: "POST",
      body: JSON.stringify({ birthday: "2020-01-01" }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error.code).toBe("VALIDATION_ERROR")
  })

  it("缺少 birthday 返回 400", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    const req = new Request("http://localhost:3000/api/children", {
      method: "POST",
      body: JSON.stringify({ name: "小明" }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error.code).toBe("VALIDATION_ERROR")
  })

  it("成功创建孩子", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    const mockChild = {
      id: "child-1",
      userId: "user-1",
      name: "小明",
      birthday: new Date("2020-01-01"),
      gender: "UNKNOWN",
      targetSchool: null,
    }
    vi.mocked(db.child.create).mockResolvedValue(mockChild as never)

    const req = new Request("http://localhost:3000/api/children", {
      method: "POST",
      body: JSON.stringify({ name: "小明", birthday: "2020-01-01" }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.data.name).toBe("小明")
    expect(db.child.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        name: "小明",
        birthday: new Date("2020-01-01"),
        gender: "UNKNOWN",
        targetSchool: undefined,
      },
    })
  })
})

describe("PUT /api/children/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("未授权返回 401", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(null)
    const req = new Request("http://localhost:3000/api/children/child-1", {
      method: "PUT",
      body: JSON.stringify({ name: "新名字", birthday: "2020-01-01" }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await PUT(req, { params: { id: "child-1" } })
    expect(res.status).toBe(401)
  })

  it("孩子不存在返回 404", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    vi.mocked(db.child.findFirst).mockResolvedValue(null)

    const req = new Request("http://localhost:3000/api/children/child-1", {
      method: "PUT",
      body: JSON.stringify({ name: "新名字", birthday: "2020-01-01" }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await PUT(req, { params: { id: "child-1" } })
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error.code).toBe("NOT_FOUND")
  })

  it("成功更新孩子信息", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    vi.mocked(db.child.findFirst).mockResolvedValue({
      id: "child-1",
      userId: "user-1",
    } as never)

    const mockUpdated = {
      id: "child-1",
      userId: "user-1",
      name: "新名字",
      birthday: new Date("2020-06-15"),
      gender: "MALE",
      targetSchool: "实验小学",
    }
    vi.mocked(db.child.update).mockResolvedValue(mockUpdated as never)

    const req = new Request("http://localhost:3000/api/children/child-1", {
      method: "PUT",
      body: JSON.stringify({
        name: "新名字",
        birthday: "2020-06-15",
        gender: "MALE",
        targetSchool: "实验小学",
      }),
      headers: { "Content-Type": "application/json" },
    })
    const res = await PUT(req, { params: { id: "child-1" } })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.data.name).toBe("新名字")
    expect(db.child.update).toHaveBeenCalledWith({
      where: { id: "child-1" },
      data: {
        name: "新名字",
        birthday: new Date("2020-06-15"),
        gender: "MALE",
        targetSchool: "实验小学",
      },
    })
  })
})

describe("DELETE /api/children/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("未授权返回 401", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(null)
    const req = new Request("http://localhost:3000/api/children/child-1", {
      method: "DELETE",
    })
    const res = await DELETE(req, { params: { id: "child-1" } })
    expect(res.status).toBe(401)
  })

  it("孩子不存在返回 404", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    vi.mocked(db.child.findFirst).mockResolvedValue(null)

    const req = new Request("http://localhost:3000/api/children/child-1", {
      method: "DELETE",
    })
    const res = await DELETE(req, { params: { id: "child-1" } })
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error.code).toBe("NOT_FOUND")
  })

  it("成功删除孩子", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    vi.mocked(db.child.findFirst).mockResolvedValue({
      id: "child-1",
      userId: "user-1",
    } as never)
    vi.mocked(db.child.delete).mockResolvedValue({} as never)

    const req = new Request("http://localhost:3000/api/children/child-1", {
      method: "DELETE",
    })
    const res = await DELETE(req, { params: { id: "child-1" } })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(db.child.delete).toHaveBeenCalledWith({
      where: { id: "child-1" },
    })
  })
})
