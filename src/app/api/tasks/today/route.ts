import { NextResponse } from "next/server"
import dayjs from "dayjs"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getCurrentPhase } from "@/lib/phaseCalculator"
import { generateDailyTasks, findWeakDimensions } from "@/lib/taskGenerator"

/** GET /api/tasks/today?childId=x - 今日任务 */
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

  // 验证孩子归属
  const child = await db.child.findFirst({
    where: { id: childId, userId: session.user.id },
  })

  if (!child) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "未找到该孩子信息" } },
      { status: 404 }
    )
  }

  const today = dayjs().startOf("day").toDate()

  // 查询今天已有的任务
  let tasks = await db.task.findMany({
    where: {
      childId,
      scheduledDate: today,
    },
    orderBy: { createdAt: "asc" },
  })

  // 如果今天没有任务，智能生成（并发双重检查，防止重复生成）
  if (tasks.length === 0) {
    const phase = getCurrentPhase(child.birthday)

    if (phase) {
      // 重新检查是否已被其他并发请求生成
      const existing = await db.task.findMany({
        where: { childId, scheduledDate: today },
      })
      if (existing.length > 0) {
        return NextResponse.json({ success: true, data: existing })
      }
      // 获取最新评估结果，识别薄弱维度
      const latestAssessments = await db.assessment.findMany({
        where: { childId },
        orderBy: { createdAt: "desc" },
        take: 4,
        select: { dimension: true, score: true },
      })

      const weakDimensions = findWeakDimensions(latestAssessments)

      // 获取近 7 天已用模板 ID
      const weekAgo = dayjs().subtract(7, "day").startOf("day").toDate()
      const recentTasks = await db.task.findMany({
        where: { childId, scheduledDate: { gte: weekAgo } },
        select: { templateId: true },
      })
      const recentTemplateIds = recentTasks.map(t => t.templateId)

      // 智能生成任务
      const generatedTasks = generateDailyTasks({
        childId,
        phase,
        weakDimensions,
        recentTemplateIds,
        existingTemplateIds: [],
      })

      // 批量创建
      if (generatedTasks.length > 0) {
        await db.task.createMany({ data: generatedTasks })
        tasks = await db.task.findMany({
          where: { childId, scheduledDate: today },
          orderBy: { createdAt: "asc" },
        })
      }
    }
  }

  return NextResponse.json({ success: true, data: tasks })
}
