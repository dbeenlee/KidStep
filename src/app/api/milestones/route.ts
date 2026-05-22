import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

/** GET /api/milestones?childId=x - 获取成长记录列表（按时间倒序） */
export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "请先登录" } },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  const childId = searchParams.get("childId")

  if (!childId) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "缺少 childId" } },
      { status: 400 }
    )
  }

  // 验证孩子属于当前用户
  const child = await db.child.findFirst({
    where: { id: childId, userId: session.user.id },
  })
  if (!child) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "孩子不存在" } },
      { status: 404 }
    )
  }

  const milestones = await db.milestone.findMany({
    where: { childId },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ success: true, data: milestones })
}

/** POST /api/milestones - 添加里程碑记录 */
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "请先登录" } },
      { status: 401 }
    )
  }

  const body = await request.json()
  const { childId, type, content, mediaUrls } = body

  if (!childId || !type) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "参数不完整" } },
      { status: 400 }
    )
  }

  // 验证孩子属于当前用户
  const child = await db.child.findFirst({
    where: { id: childId, userId: session.user.id },
  })
  if (!child) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "孩子不存在" } },
      { status: 404 }
    )
  }

  const milestone = await db.milestone.create({
    data: {
      childId,
      type,
      content: content ?? null,
      mediaUrls: mediaUrls ? JSON.stringify(mediaUrls) : null,
    },
  })

  return NextResponse.json({ success: true, data: milestone })
}
