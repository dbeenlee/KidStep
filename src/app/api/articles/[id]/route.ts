import { NextResponse } from "next/server"
import { db } from "@/lib/db"

/** GET /api/articles/[id] - 获取文章详情，同时 views +1 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params

  const article = await db.article.findUnique({ where: { id } })
  if (!article) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "文章不存在" } },
      { status: 404 }
    )
  }

  // 阅读量 +1
  await db.article.update({
    where: { id },
    data: { views: { increment: 1 } },
  })

  return NextResponse.json({
    success: true,
    data: { ...article, views: article.views + 1 },
  })
}
