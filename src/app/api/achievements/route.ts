import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { ACHIEVEMENTS } from "@/constants/achievements"

/** GET /api/achievements?childId=xxx - 查询成就列表及解锁状态 */
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
      { success: false, error: { code: "VALIDATION_ERROR", message: "缺少 childId 参数" } },
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

  try {
    // 查询该孩子已解锁的成就
    const userAchievements = await db.userAchievement.findMany({
      where: { childId },
      include: { achievement: true },
    })

    // 构建已解锁 map: code -> unlockedAt
    const unlockedMap = new Map<string, string>()
    for (const ua of userAchievements) {
      unlockedMap.set(ua.achievement.code, ua.unlockedAt.toISOString())
    }

    // 合并成就定义和解锁状态
    const achievements = ACHIEVEMENTS.map((def) => ({
      ...def,
      unlocked: unlockedMap.has(def.code),
      unlockedAt: unlockedMap.get(def.code),
    }))

    return NextResponse.json({
      success: true,
      data: { achievements },
    })
  } catch (error) {
    console.error("查询成就失败:", error)
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "查询成就失败" } },
      { status: 500 }
    )
  }
}
