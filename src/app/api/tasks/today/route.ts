import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { QUESTIONS } from "@/constants/questions"

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

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 查询今日已有的任务
  let tasks = await db.task.findMany({
    where: {
      childId,
      scheduledDate: today,
    },
    orderBy: { createdAt: "asc" },
  })

  // 如果今日没有任务，自动生成
  if (tasks.length === 0) {
    // 获取最近评估的薄弱项
    const latestAssessment = await db.assessment.findFirst({
      where: { childId },
      orderBy: { createdAt: "desc" },
    })

    // 使用默认任务模板（实际应从 constants/taskTemplates 导入）
    const defaultTasks = [
      { templateId: "habit-001", title: "早起打卡", description: "7:00前起床，自己穿衣服", type: "HABIT", duration: 1 },
      { templateId: "habit-002", title: "阅读打卡", description: "亲子共读一本绘本，至少15分钟", type: "HABIT", duration: 15 },
      { templateId: "habit-003", title: "运动打卡", description: "户外运动30分钟", type: "HABIT", duration: 30 },
    ]

    const created = await Promise.all(
      defaultTasks.map(t =>
        db.task.create({
          data: {
            childId,
            phase: "PHASE_1",
            taskType: t.type as never,
            templateId: t.templateId,
            title: t.title,
            description: t.description,
            duration: t.duration,
            scheduledDate: today,
          },
        })
      )
    )
    tasks = created
  }

  return NextResponse.json({ success: true, data: tasks })
}
