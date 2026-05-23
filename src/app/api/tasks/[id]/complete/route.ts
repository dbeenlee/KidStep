import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { randomItem } from "@/lib/utils"
import { ENCOURAGEMENTS } from "@/constants/encouragements"
import { calculateStreak, calculateTaskPoints } from "@/lib/streakCalculator"

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
  const userId = session.user.id
  const now = new Date()

  // 使用交互式事务，将状态检查放在事务内部，防止并发重复完成
  const result = await db.$transaction(async (tx) => {
    const task = await tx.task.findFirst({
      where: {
        id: taskId,
        child: { userId },
      },
    })

    if (!task) {
      return { error: "NOT_FOUND" as const }
    }

    if (task.status !== "PENDING") {
      return { error: "INVALID_STATUS" as const }
    }

    // 先更新任务状态为完成，这样后续查询 completedTasks 才能包含本任务
    const updatedTask = await tx.task.update({
      where: { id: taskId },
      data: {
        status: "COMPLETED",
        completedAt: now,
      },
    })

    // 计算积分：基础2分 + 连续奖励
    const completedTasks = await tx.task.findMany({
      where: {
        childId: task.childId,
        status: "COMPLETED",
      },
      select: { scheduledDate: true },
      distinct: ["scheduledDate"],
      orderBy: { scheduledDate: "desc" },
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const streak = calculateStreak(
      completedTasks.map((t) => ({ date: t.scheduledDate })),
      today
    )
    const { base: basePoints, bonus: bonusPoints, total: totalPoints } = calculateTaskPoints(streak)

    const point = await tx.point.create({
      data: {
        childId: task.childId,
        amount: totalPoints,
        reason: bonusPoints > 0
          ? `完成任务「${task.title}」+${basePoints}，连续${streak}天 +${bonusPoints}`
          : `完成任务「${task.title}」+${basePoints}`,
        source: "TASK_COMPLETE",
      },
    })

    return { task: updatedTask, point, error: null }
  })

  if (result.error === "NOT_FOUND") {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "任务不存在" } },
      { status: 404 }
    )
  }

  if (result.error === "INVALID_STATUS") {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_STATUS", message: "任务状态不允许此操作" } },
      { status: 400 }
    )
  }

  // 触发成就检查（不阻塞主流程）
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
  fetch(`${baseUrl}/api/achievements/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ childId: result.task.childId, event: "task_complete" }),
  }).catch(() => {
    // 静默处理，不影响主流程
  })

  return NextResponse.json({
    success: true,
    data: {
      task: result.task,
      point: result.point,
      encouragement: randomItem([...ENCOURAGEMENTS.taskComplete]),
    },
  })
}
