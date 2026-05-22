import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

/** GET /api/favorites - 获取当前用户的收藏列表 */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "请先登录" } },
      { status: 401 }
    )
  }

  const favorites = await db.favorite.findMany({
    where: { userId: session.user.id },
    include: {
      article: {
        select: {
          id: true,
          category: true,
          title: true,
          summary: true,
          coverUrl: true,
          views: true,
          likes: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({
    success: true,
    data: favorites.map(f => f.article),
  })
}

/** POST /api/favorites - 添加收藏 */
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "请先登录" } },
      { status: 401 }
    )
  }

  const body = await request.json()
  const { articleId } = body

  if (!articleId) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "缺少 articleId" } },
      { status: 400 }
    )
  }

  // 检查文章是否存在
  const article = await db.article.findUnique({ where: { id: articleId } })
  if (!article) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "文章不存在" } },
      { status: 404 }
    )
  }

  // 幂等：已收藏则直接返回
  const existing = await db.favorite.findUnique({
    where: { userId_articleId: { userId: session.user.id, articleId } },
  })
  if (existing) {
    return NextResponse.json({ success: true, data: existing })
  }

  const favorite = await db.favorite.create({
    data: { userId: session.user.id, articleId },
  })

  return NextResponse.json({ success: true, data: favorite })
}

/** DELETE /api/favorites?id=xxx - 取消收藏 */
export async function DELETE(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "请先登录" } },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  const articleId = searchParams.get("id")

  if (!articleId) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "缺少 id 参数" } },
      { status: 400 }
    )
  }

  await db.favorite.deleteMany({
    where: { userId: session.user.id, articleId },
  })

  return NextResponse.json({ success: true, data: null })
}
