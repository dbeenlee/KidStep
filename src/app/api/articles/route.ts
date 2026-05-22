import { NextResponse } from "next/server"
import { db } from "@/lib/db"

/** GET /api/articles?category=x&page=1&pageSize=10 - 文章列表 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category")
  const page = parseInt(searchParams.get("page") ?? "1")
  const pageSize = parseInt(searchParams.get("pageSize") ?? "10")

  const where = category ? { category: category as never } : {}

  const [articles, total] = await Promise.all([
    db.article.findMany({
      where,
      orderBy: { sortOrder: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        category: true,
        title: true,
        summary: true,
        coverUrl: true,
        tags: true,
        views: true,
        likes: true,
        createdAt: true,
      },
    }),
    db.article.count({ where }),
  ])

  return NextResponse.json({
    success: true,
    data: {
      items: articles,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  })
}
