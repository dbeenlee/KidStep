import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

/** 评估维度列表 */
const DIMENSIONS = ["PHYSICAL", "LIFE", "SOCIAL", "LEARNING"] as const

/** GET /api/report?childId=xxx - 生成入学准备报告数据 */
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
    select: { id: true, name: true, birthday: true, targetSchool: true },
  })

  if (!child) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "孩子不存在" } },
      { status: 404 }
    )
  }

  // 并行查询所有数据
  const [assessments, milestones, totalPointsAgg, recentCheckins] = await Promise.all([
    // 每个维度取最新一条评估
    db.assessment.findMany({
      where: { childId },
      orderBy: { createdAt: "desc" },
      select: { dimension: true, score: true, createdAt: true },
    }),
    // 最近 3 个月的里程碑
    db.milestone.findMany({
      where: {
        childId,
        createdAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { createdAt: "desc" },
      select: { type: true, content: true, mediaUrls: true, createdAt: true },
    }),
    // 总积分
    db.point.aggregate({
      where: { childId },
      _sum: { amount: true },
    }),
    // 最近打卡记录（用于计算连续天数）
    db.checkin.findMany({
      where: { childId },
      select: { date: true },
      distinct: ["date"],
      orderBy: { date: "desc" },
      take: 30,
    }),
  ])

  // 每个维度取最新的一条
  const latestAssessments = DIMENSIONS.map(dim => {
    const found = assessments.find(a => a.dimension === dim)
    return found
      ? { dimension: found.dimension, score: found.score, createdAt: found.createdAt.toISOString() }
      : { dimension: dim, score: 0, createdAt: "" }
  })

  // 计算连续打卡天数
  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (const checkin of recentCheckins) {
    const checkinDate = new Date(checkin.date)
    checkinDate.setHours(0, 0, 0, 0)
    const diffDays = Math.floor(
      (today.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    if (diffDays === streak) {
      streak++
    } else {
      break
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      child: {
        name: child.name,
        birthday: child.birthday.toISOString(),
        targetSchool: child.targetSchool,
      },
      assessments: latestAssessments,
      milestones: milestones.map(m => ({
        type: m.type,
        content: m.content,
        mediaUrls: m.mediaUrls,
        createdAt: m.createdAt.toISOString(),
      })),
      totalPoints: totalPointsAgg._sum.amount ?? 0,
      streak,
    },
  })
}
