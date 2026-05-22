import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

/** 日历中单日的打卡状态 */
interface DayCheckinStatus {
  date: string
  completedCount: number
  totalCount: number
  status: "full" | "partial" | "none" | "noTask"
}

/** GET /api/checkins/calendar?childId=x&month=2026-05 */
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
  const month = searchParams.get("month") // 格式: YYYY-MM

  if (!childId || !month) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "缺少 childId 或 month" } },
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

  // 解析月份范围
  const [year, monthNum] = month.split("-").map(Number)
  const startDate = new Date(year, monthNum - 1, 1)
  const endDate = new Date(year, monthNum, 0) // 该月最后一天

  // 查询该月所有任务
  const tasks = await db.task.findMany({
    where: {
      childId,
      scheduledDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      scheduledDate: true,
      status: true,
    },
  })

  // 按日期聚合任务状态
  const taskMap = new Map<string, { total: number; completed: number }>()
  for (const task of tasks) {
    const dateKey = new Date(task.scheduledDate).toISOString().split("T")[0]
    const existing = taskMap.get(dateKey) ?? { total: 0, completed: 0 }
    existing.total++
    if (task.status === "COMPLETED") {
      existing.completed++
    }
    taskMap.set(dateKey, existing)
  }

  // 生成整月的日历数据
  const calendar: DayCheckinStatus[] = []
  const daysInMonth = endDate.getDate()

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, monthNum - 1, day)
    const dateKey = date.toISOString().split("T")[0]
    const taskInfo = taskMap.get(dateKey)

    let status: DayCheckinStatus["status"] = "noTask"
    if (taskInfo) {
      if (taskInfo.completed === taskInfo.total) {
        status = "full"
      } else if (taskInfo.completed > 0) {
        status = "partial"
      } else {
        status = "none"
      }
    }

    calendar.push({
      date: dateKey,
      completedCount: taskInfo?.completed ?? 0,
      totalCount: taskInfo?.total ?? 0,
      status,
    })
  }

  return NextResponse.json({ success: true, data: calendar })
}
