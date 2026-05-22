import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

/** GET /api/checkins/stats?childId=x */
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

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 查询所有已完成的任务，按日期去重
  const completedTasks = await db.task.findMany({
    where: {
      childId,
      status: "COMPLETED",
    },
    select: { scheduledDate: true },
    distinct: ["scheduledDate"],
    orderBy: { scheduledDate: "desc" },
  })

  // 计算连续打卡天数（从今天往前数）
  let streakDays = 0
  const current = new Date(today)
  for (const task of completedTasks) {
    const taskDate = new Date(task.scheduledDate)
    taskDate.setHours(0, 0, 0, 0)
    const diffDays = Math.floor(
      (current.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    if (diffDays === streakDays) {
      streakDays++
    } else {
      break
    }
  }

  // 本月打卡率
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const monthTasks = await db.task.findMany({
    where: {
      childId,
      scheduledDate: {
        gte: monthStart,
        lte: today,
      },
    },
    select: { status: true, scheduledDate: true },
  })

  // 按日期分组，统计有任务的天数和完成的天数
  const dayMap = new Map<string, { total: number; completed: number }>()
  for (const task of monthTasks) {
    const dateKey = new Date(task.scheduledDate).toISOString().split("T")[0]
    const existing = dayMap.get(dateKey) ?? { total: 0, completed: 0 }
    existing.total++
    if (task.status === "COMPLETED") {
      existing.completed++
    }
    dayMap.set(dateKey, existing)
  }

  const daysWithTasks = dayMap.size
  const daysFullyCompleted = Array.from(dayMap.values()).filter(
    d => d.completed === d.total
  ).length
  const monthRate = daysWithTasks > 0
    ? Math.round((daysFullyCompleted / daysWithTasks) * 100)
    : 0

  // 总打卡天数（有完成任务的日期数）
  const totalCheckinDays = completedTasks.length

  // 本周打卡统计
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay()) // 本周日
  weekStart.setHours(0, 0, 0, 0)

  const weekTasks = await db.task.findMany({
    where: {
      childId,
      scheduledDate: {
        gte: weekStart,
        lte: today,
      },
    },
    select: { status: true },
  })

  const weekCompleted = weekTasks.filter(t => t.status === "COMPLETED").length
  const weekTotal = weekTasks.length

  return NextResponse.json({
    success: true,
    data: {
      streakDays,
      monthRate,
      totalCheckinDays,
      weekStats: {
        completed: weekCompleted,
        total: weekTotal,
      },
    },
  })
}
