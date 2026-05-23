import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

/** GET /api/tasks/stats?childId=x */
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

  // 用聚合查询替代全表加载，防止 OOM
  const [total, completed, skipped, pending] = await Promise.all([
    db.task.count({ where: { childId } }),
    db.task.count({ where: { childId, status: "COMPLETED" } }),
    db.task.count({ where: { childId, status: "SKIPPED" } }),
    db.task.count({ where: { childId, status: "PENDING" } }),
  ])

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

  // 按任务类型分组统计
  const typeGroups = await db.task.groupBy({
    by: ["taskType"],
    where: { childId },
    _count: { id: true },
  })

  const completedTypeGroups = await db.task.groupBy({
    by: ["taskType"],
    where: { childId, status: "COMPLETED" },
    _count: { id: true },
  })

  const completedTypeMap = new Map(
    completedTypeGroups.map(g => [g.taskType, g._count.id])
  )

  const typeDistribution = typeGroups.map(g => ({
    type: g.taskType,
    count: g._count.id,
    completed: completedTypeMap.get(g.taskType) ?? 0,
  }))

  // 最近 30 天每日趋势 — 只查近 30 天数据
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(today.getDate() - 29)

  const recentTasks = await db.task.findMany({
    where: {
      childId,
      scheduledDate: { gte: thirtyDaysAgo, lte: today },
    },
    select: { scheduledDate: true, status: true },
  })

  const dailyMap = new Map<string, { total: number; completed: number }>()
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo)
    d.setDate(thirtyDaysAgo.getDate() + i)
    const key = d.toISOString().split("T")[0]
    dailyMap.set(key, { total: 0, completed: 0 })
  }

  for (const task of recentTasks) {
    const key = new Date(task.scheduledDate).toISOString().split("T")[0]
    const existing = dailyMap.get(key)
    if (existing) {
      existing.total++
      if (task.status === "COMPLETED") {
        existing.completed++
      }
    }
  }

  const dailyTrend = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      total: data.total,
      completed: data.completed,
    }))

  return NextResponse.json({
    success: true,
    data: {
      total,
      completed,
      skipped,
      pending,
      completionRate,
      typeDistribution,
      dailyTrend,
    },
  })
}
