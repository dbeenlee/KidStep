import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { randomItem } from "@/lib/utils"
import { ENCOURAGEMENTS } from "@/constants/encouragements"

/** PATCH /api/tasks/:id/complete - 标记任务完成 */
export async function PATCH(
  request: Request,
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
    include: { child: true },
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

  const now = new Date()

  // 计算积分：基础2分 + 连续奖励
  const completedTasks = await db.task.findMany({
    where: {
      childId: task.childId,
      status: "COMPLETED",
    },
    select: { scheduledDate: true },
    distinct: ["scheduledDate"],
    orderBy: { scheduledDate: "desc" },
  })

  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const current = new Date(today)
  for (const t of completedTasks) {
    const taskDate = new Date(t.scheduledDate)
    taskDate.setHours(0, 0, 0, 0)
    const diffDays = Math.floor(
      (current.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    if (diffDays === streak) {
      streak++
    } else {
      break
    }
  }

  const basePoints = 2
  const bonusPoints = Math.min(streak, 7)
  const totalPoints = basePoints + bonusPoints

  // 事务：更新任务状态 + 发放积分
  const [updatedTask, point] = await db.$transaction([
    db.task.update({
      where: { id: taskId },
      data: {
        status: "COMPLETED",
        completedAt: now,
      },
    }),
    db.point.create({
      data: {
        childId: task.childId,
        amount: totalPoints,
        reason: bonusPoints > 0
          ? `完成任务「${task.title}」+${basePoints}，连续${streak}天 +${bonusPoints}`
          : `完成任务「${task.title}」+${basePoints}`,
        source: "TASK",
      },
    }),
  ])

  return NextResponse.json({
    success: true,
    data: {
      task: updatedTask,
      point,
      encouragement: randomItem([...ENCOURAGEMENTS.taskComplete]),
    },
  })
}
