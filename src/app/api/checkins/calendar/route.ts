import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { buildCalendarDays } from "@/lib/calendarStatus"

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

  // 构建整月日历数据
  const calendar = buildCalendarDays(tasks, year, monthNum)

  return NextResponse.json({ success: true, data: calendar })
}
