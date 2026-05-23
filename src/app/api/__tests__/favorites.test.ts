import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    favorite: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    article: { findUnique: vi.fn() },
  },
}))

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { GET, POST, DELETE } from "@/app/api/favorites/route"

const mockSession = { user: { id: "user-1" } }
const mockArticle = {
  id: "article-1",
  category: "LIFE",
  title: "测试文章",
  summary: "摘要",
  coverUrl: null,
  views: 0,
  likes: 0,
  createdAt: new Date(),
}

describe("GET /api/favorites", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("未授权返回 401", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it("成功返回收藏列表", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    const mockFavorites = [
      { id: "f-1", userId: "user-1", articleId: "article-1", article: mockArticle },
    ]
    vi.mocked(db.favorite.findMany).mockResolvedValue(mockFavorites as never)

    const res = await GET()
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveLength(1)
    expect(data.data[0].id).toBe("article-1")
    expect(data.data[0].title).toBe("测试文章")

    expect(db.favorite.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1" },
        include: { article: expect.any(Object) },
        orderBy: { createdAt: "desc" },
      }),
    )
  })
})

describe("POST /api/favorites", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("未授权返回 401", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(null)
    const req = new Request("http://localhost:3000/api/favorites", {
      method: "POST",
      body: JSON.stringify({ articleId: "article-1" }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it("缺少 articleId 返回 400", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    const req = new Request("http://localhost:3000/api/favorites", {
      method: "POST",
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error.code).toBe("VALIDATION_ERROR")
  })

  it("文章不存在返回 404", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    vi.mocked(db.article.findUnique).mockResolvedValue(null)
    const req = new Request("http://localhost:3000/api/favorites", {
      method: "POST",
      body: JSON.stringify({ articleId: "nonexistent" }),
    })
    const res = await POST(req)
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error.code).toBe("NOT_FOUND")
  })

  it("已收藏时幂等返回（不重复创建）", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    vi.mocked(db.article.findUnique).mockResolvedValue(mockArticle as never)
    const existing = { id: "f-1", userId: "user-1", articleId: "article-1" }
    vi.mocked(db.favorite.findUnique).mockResolvedValue(existing as never)

    const req = new Request("http://localhost:3000/api/favorites", {
      method: "POST",
      body: JSON.stringify({ articleId: "article-1" }),
    })
    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(existing)
    expect(db.favorite.create).not.toHaveBeenCalled()
  })

  it("成功收藏文章", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    vi.mocked(db.article.findUnique).mockResolvedValue(mockArticle as never)
    vi.mocked(db.favorite.findUnique).mockResolvedValue(null)
    const newFavorite = { id: "f-new", userId: "user-1", articleId: "article-1" }
    vi.mocked(db.favorite.create).mockResolvedValue(newFavorite as never)

    const req = new Request("http://localhost:3000/api/favorites", {
      method: "POST",
      body: JSON.stringify({ articleId: "article-1" }),
    })
    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(newFavorite)
    expect(db.favorite.create).toHaveBeenCalledWith({
      data: { userId: "user-1", articleId: "article-1" },
    })
  })
})

describe("DELETE /api/favorites", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("未授权返回 401", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(null)
    const req = new Request("http://localhost:3000/api/favorites?id=article-1", {
      method: "DELETE",
    })
    const res = await DELETE(req)
    expect(res.status).toBe(401)
  })

  it("缺少 id 参数返回 400", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    const req = new Request("http://localhost:3000/api/favorites", {
      method: "DELETE",
    })
    const res = await DELETE(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error.code).toBe("VALIDATION_ERROR")
  })

  it("成功取消收藏", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    vi.mocked(db.favorite.deleteMany).mockResolvedValue({ count: 1 } as never)

    const req = new Request("http://localhost:3000/api/favorites?id=article-1", {
      method: "DELETE",
    })
    const res = await DELETE(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toBeNull()
    expect(db.favorite.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1", articleId: "article-1" },
    })
  })
})
