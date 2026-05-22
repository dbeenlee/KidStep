import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

/** PATCH /api/tasks/:id/skip - 标记任务跳过 */
export async function PATCH(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "请先登录" } },
      { status: 401 }
    )
  }

  const taskId = params.id

  // 查找任务并验证归属
  const task = await db.task.findFirst({
    where: {
      id: taskId,
      child: { userId: session.user.id },
    },
  })

  if (!task) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "任务不存在" } },
      { status: 404 }
    )
  }

  if (task.status !== "PENDING") {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_STATUS", message: "任务状态不允许此操作" } },
      { status: 400 }
    )
  }

  // 跳过任务 - 不扣分（只奖不扣原则）
  const updatedTask = await db.task.update({
    where: { id: taskId },
    data: { status: "SKIPPED" },
  })

  return NextResponse.json({
    success: true,
    data: {
      task: updatedTask,
    },
  })
}
