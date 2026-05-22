import { NextResponse } from "next/server"
import { db } from "@/lib/db"

/** GET /api/articles/search?q=keyword - 在标题和摘要中搜索文章 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")?.trim()

  if (!q) {
    return NextResponse.json({
      success: true,
      data: { items: [] },
    })
  }

  const articles = await db.article.findMany({
    where: {
      OR: [
        { title: { contains: q } },
        { summary: { contains: q } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 20,
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
  })

  return NextResponse.json({
    success: true,
    data: { items: articles },
  })
}
