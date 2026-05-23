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

  // 本月起始时间
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  // 本周起始时间（周一）
  const weekStart = new Date()
  const dayOfWeek = weekStart.getDay()
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  weekStart.setDate(weekStart.getDate() - diff)
  weekStart.setHours(0, 0, 0, 0)

  // 用聚合查询替代全表加载，防止 OOM
  const [totalAgg, monthAgg, weekAgg, history] = await Promise.all([
    db.point.aggregate({
      where: { childId },
      _sum: { amount: true },
    }),
    db.point.aggregate({
      where: { childId, createdAt: { gte: monthStart } },
      _sum: { amount: true },
    }),
    db.point.aggregate({
      where: { childId, createdAt: { gte: weekStart } },
      _sum: { amount: true },
    }),
    db.point.findMany({
      where: { childId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        amount: true,
        reason: true,
        source: true,
        createdAt: true,
      },
    }),
  ])

  const totalPoints = totalAgg._sum.amount ?? 0
  const totalEarned = totalPoints // 积分只增不减，总积分即总获得
  const monthTotal = monthAgg._sum.amount ?? 0
  const thisWeekTotal = weekAgg._sum.amount ?? 0

  return NextResponse.json({
    success: true,
    data: {
      totalPoints,
      totalEarned,
      monthTotal,
      thisWeekTotal,
      history,
    },
  })
}
