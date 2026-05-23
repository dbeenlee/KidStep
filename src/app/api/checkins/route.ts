import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { randomItem } from "@/lib/utils"
import { calculateStreak, calculateCheckinPoints } from "@/lib/streakCalculator"

/** POST /api/checkins - 打卡 */
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "请先登录" } },
      { status: 401 }
    )
  }

  const body = await request.json()
  const { childId, type, itemName, note } = body

  if (!childId || !type || !itemName) {
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

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 创建打卡记录
  const checkin = await db.checkin.create({
    data: {
      childId,
      date: today,
      type,
      itemName,
      note,
    },
  })

  // 计算积分：基础1分 + 连续打卡奖励
  const recentCheckins = await db.checkin.findMany({
    where: { childId },
    select: { date: true },
    distinct: ["date"],
    orderBy: { date: "desc" },
    take: 30,
  })

  const streak = calculateStreak(recentCheckins, today)
  const { base: basePoints, bonus: bonusPoints, total: totalPoints } = calculateCheckinPoints(streak)

  const point = await db.point.create({
    data: {
      childId,
      amount: totalPoints,
      reason:
        bonusPoints > 0
          ? `打卡 +${basePoints}，连续${streak}天 +${bonusPoints}`
          : `打卡 +${basePoints}`,
      source: bonusPoints > 0 ? "STREAK" : "CHECKIN",
    },
  })

  // 鼓励语
  const encouragements = [
    "太棒了，今天又完成了一项！",
    "坚持就是胜利，你做到了！",
    "每一步都是进步！",
    "好习惯就是这样养成的！",
  ]

  // 触发成就检查（不阻塞主流程）
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
  fetch(`${baseUrl}/api/achievements/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ childId, event: "checkin" }),
  }).catch(() => {
    // 静默处理，不影响主流程
  })

  return NextResponse.json({
    success: true,
    data: {
      checkin,
      point,
      encouragement: randomItem(encouragements),
      streak,
    },
  })
}
