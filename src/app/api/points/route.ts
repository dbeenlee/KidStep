import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

/** GET /api/points?childId=x */
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

  // 总积分
  const points = await db.point.findMany({
    where: { childId },
    select: { amount: true },
  })
  const totalPoints = points.reduce((sum, p) => sum + p.amount, 0)

  // 积分历史（最近20条）
  const history = await db.point.findMany({
    where: { childId },
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  // 本月获得积分
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const monthPoints = await db.point.findMany({
    where: {
      childId,
      createdAt: { gte: monthStart },
    },
    select: { amount: true },
  })
  const monthTotal = monthPoints.reduce((sum, p) => sum + p.amount, 0)

  return NextResponse.json({
    success: true,
    data: {
      totalPoints,
      monthTotal,
      history,
    },
  })
}
