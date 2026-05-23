import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/db", () => ({
  db: {
    article: { findMany: vi.fn(), count: vi.fn() },
  },
}))

import { db } from "@/lib/db"
import { GET } from "@/app/api/articles/route"

const mockArticles = [
  {
    id: "a-1",
    category: "LIFE",
    title: "如何培养自理能力",
    summary: "培养孩子自理能力的方法",
    coverUrl: "/images/a1.jpg",
    tags: "自理",
    views: 100,
    likes: 10,
    createdAt: new Date(),
  },
  {
    id: "a-2",
    category: "LEARNING",
    title: "幼小衔接学习准备",
    summary: "帮助孩子做好学习准备",
    coverUrl: "/images/a2.jpg",
    tags: "学习",
    views: 200,
    likes: 20,
    createdAt: new Date(),
  },
]

describe("GET /api/articles", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("无认证也可访问", async () => {
    vi.mocked(db.article.findMany).mockResolvedValue([] as never)
    vi.mocked(db.article.count).mockResolvedValue(0)

    const req = new Request("http://localhost:3000/api/articles")
    const res = await GET(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
  })

  it("默认分页返回文章列表", async () => {
    vi.mocked(db.article.findMany).mockResolvedValue(mockArticles as never)
    vi.mocked(db.article.count).mockResolvedValue(2)

    const req = new Request("http://localhost:3000/api/articles")
    const res = await GET(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.items).toHaveLength(2)
    expect(data.data.items[0].id).toBe("a-1")
    expect(data.data.items[1].id).toBe("a-2")
    expect(data.data.total).toBe(2)
    expect(data.data.page).toBe(1)
    expect(data.data.pageSize).toBe(10)
    expect(data.data.totalPages).toBe(1)

    expect(db.article.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
        orderBy: { sortOrder: "asc" },
        skip: 0,
        take: 10,
      }),
    )
  })

  it("带 category 筛选", async () => {
    vi.mocked(db.article.findMany).mockResolvedValue([mockArticles[0]] as never)
    vi.mocked(db.article.count).mockResolvedValue(1)

    const req = new Request("http://localhost:3000/api/articles?category=LIFE")
    const res = await GET(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.data.items).toHaveLength(1)

    expect(db.article.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { category: "LIFE" },
      }),
    )
  })

  it("自定义分页参数", async () => {
    vi.mocked(db.article.findMany).mockResolvedValue([] as never)
    vi.mocked(db.article.count).mockResolvedValue(25)

    const req = new Request("http://localhost:3000/api/articles?page=2&pageSize=5")
    const res = await GET(req)
    const data = await res.json()

    expect(data.data.page).toBe(2)
    expect(data.data.pageSize).toBe(5)
    expect(data.data.totalPages).toBe(5) // ceil(25/5)

    expect(db.article.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 5,
        take: 5,
      }),
    )
  })

  it("空列表返回正确的分页信息", async () => {
    vi.mocked(db.article.findMany).mockResolvedValue([] as never)
    vi.mocked(db.article.count).mockResolvedValue(0)

    const req = new Request("http://localhost:3000/api/articles")
    const res = await GET(req)
    const data = await res.json()

    expect(data.data.items).toEqual([])
    expect(data.data.total).toBe(0)
    expect(data.data.totalPages).toBe(0)
  })
})
