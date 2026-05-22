import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

/** DELETE /api/favorites/[id] - 取消收藏（id 为 articleId） */
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "请先登录" } },
      { status: 401 }
    )
  }

  const { id: articleId } = params

  await db.favorite.deleteMany({
    where: { userId: session.user.id, articleId },
  })

  return NextResponse.json({ success: true, data: null })
}
