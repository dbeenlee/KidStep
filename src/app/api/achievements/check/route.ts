import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { ACHIEVEMENTS, type AchievementDef } from "@/constants/achievements"

/** 成就检查事件类型 */
type AchievementEvent =
  | "task_complete"
  | "checkin"
  | "assessment"
  | "milestone"
  | "article_read"
  | "favorite"

interface CheckRequest {
  childId: string
  event: AchievementEvent
}

/** 解锁成就并返回成就信息 */
async function unlockAchievement(
  userId: string,
  childId: string,
  achievement: AchievementDef
) {
  try {
    const record = await db.userAchievement.create({
      data: {
        userId,
        childId,
        achievementId: (
          await db.achievement.findUniqueOrThrow({ where: { code: achievement.code } })
        ).id,
      },
    })
    return { ...achievement, unlockedAt: record.unlockedAt.toISOString() }
  } catch {
    // 唯一约束冲突表示已解锁，忽略
    return null
  }
}

/** 检查评估类成就 */
async function checkAssessmentAchievements(userId: string, childId: string) {
  const newAchievements: Array<AchievementDef & { unlockedAt: string }> = []

  // 查询已解锁的评估成就 code
  const unlocked = await db.userAchievement.findMany({
    where: {
      childId,
      achievement: { category: "ASSESSMENT" },
    },
    include: { achievement: true },
  })
  const unlockedCodes = new Set(unlocked.map((u) => u.achievement.code))

  // first_assessment: 首次评估
  if (!unlockedCodes.has("first_assessment")) {
    const count = await db.assessment.count({ where: { childId } })
    if (count >= 1) {
      const result = await unlockAchievement(userId, childId, ACHIEVEMENTS.find((a) => a.code === "first_assessment")!)
      if (result) newAchievements.push(result)
    }
  }

  // all_dimensions: 4个维度都评估
  if (!unlockedCodes.has("all_dimensions")) {
    const dimensions = await db.assessment.findMany({
      where: { childId },
      select: { dimension: true },
      distinct: ["dimension"],
    })
    if (dimensions.length >= 4) {
      const result = await unlockAchievement(userId, childId, ACHIEVEMENTS.find((a) => a.code === "all_dimensions")!)
      if (result) newAchievements.push(result)
    }
  }

  // score_excellent: 单维度≥90
  if (!unlockedCodes.has("score_excellent")) {
    const excellent = await db.assessment.findFirst({
      where: { childId, score: { gte: 90 } },
    })
    if (excellent) {
      const result = await unlockAchievement(userId, childId, ACHIEVEMENTS.find((a) => a.code === "score_excellent")!)
      if (result) newAchievements.push(result)
    }
  }

  return newAchievements
}

/** 检查打卡类成就 */
async function checkCheckinAchievements(userId: string, childId: string) {
  const newAchievements: Array<AchievementDef & { unlockedAt: string }> = []

  const unlocked = await db.userAchievement.findMany({
    where: {
      childId,
      achievement: { category: "CHECKIN" },
    },
    include: { achievement: true },
  })
  const unlockedCodes = new Set(unlocked.map((u) => u.achievement.code))

  // first_checkin: 首次打卡
  if (!unlockedCodes.has("first_checkin")) {
    const count = await db.checkin.count({ where: { childId } })
    if (count >= 1) {
      const result = await unlockAchievement(userId, childId, ACHIEVEMENTS.find((a) => a.code === "first_checkin")!)
      if (result) newAchievements.push(result)
    }
  }

  // 计算连续打卡天数
  const recentCheckins = await db.checkin.findMany({
    where: { childId },
    select: { date: true },
    distinct: ["date"],
    orderBy: { date: "desc" },
    take: 31,
  })

  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const current = new Date(today)

  for (const c of recentCheckins) {
    const checkinDate = new Date(c.date)
    checkinDate.setHours(0, 0, 0, 0)
    const diffDays = Math.floor(
      (current.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    if (diffDays === streak) {
      streak++
    } else {
      break
    }
  }

  // streak_3 / streak_7 / streak_30
  const streakChecks: Array<{ code: string; days: number }> = [
    { code: "streak_3", days: 3 },
    { code: "streak_7", days: 7 },
    { code: "streak_30", days: 30 },
  ]

  for (const check of streakChecks) {
    if (!unlockedCodes.has(check.code) && streak >= check.days) {
      const def = ACHIEVEMENTS.find((a) => a.code === check.code)!
      const result = await unlockAchievement(userId, childId, def)
      if (result) newAchievements.push(result)
    }
  }

  // first_milestone: 首次里程碑
  if (!unlockedCodes.has("first_milestone")) {
    const count = await db.milestone.count({ where: { childId } })
    if (count >= 1) {
      const result = await unlockAchievement(userId, childId, ACHIEVEMENTS.find((a) => a.code === "first_milestone")!)
      if (result) newAchievements.push(result)
    }
  }

  return newAchievements
}

/** 检查任务类成就 */
async function checkTaskAchievements(userId: string, childId: string) {
  const newAchievements: Array<AchievementDef & { unlockedAt: string }> = []

  const unlocked = await db.userAchievement.findMany({
    where: {
      childId,
      achievement: { category: "TASK" },
    },
    include: { achievement: true },
  })
  const unlockedCodes = new Set(unlocked.map((u) => u.achievement.code))

  // first_task: 首次任务
  if (!unlockedCodes.has("first_task")) {
    const count = await db.task.count({ where: { childId, status: "COMPLETED" } })
    if (count >= 1) {
      const result = await unlockAchievement(userId, childId, ACHIEVEMENTS.find((a) => a.code === "first_task")!)
      if (result) newAchievements.push(result)
    }
  }

  // tasks_10 / tasks_50: 累计完成任务数
  const completedCount = await db.task.count({ where: { childId, status: "COMPLETED" } })
  const countChecks: Array<{ code: string; value: number }> = [
    { code: "tasks_10", value: 10 },
    { code: "tasks_50", value: 50 },
  ]

  for (const check of countChecks) {
    if (!unlockedCodes.has(check.code) && completedCount >= check.value) {
      const def = ACHIEVEMENTS.find((a) => a.code === check.code)!
      const result = await unlockAchievement(userId, childId, def)
      if (result) newAchievements.push(result)
    }
  }

  // task_streak_3 / task_streak_7: 连续完成任务天数
  const completedTasks = await db.task.findMany({
    where: { childId, status: "COMPLETED" },
    select: { scheduledDate: true },
    distinct: ["scheduledDate"],
    orderBy: { scheduledDate: "desc" },
    take: 8,
  })

  let taskStreak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const current = new Date(today)

  for (const t of completedTasks) {
    const taskDate = new Date(t.scheduledDate)
    taskDate.setHours(0, 0, 0, 0)
    const diffDays = Math.floor(
      (current.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    if (diffDays === taskStreak) {
      taskStreak++
    } else {
      break
    }
  }

  const taskStreakChecks: Array<{ code: string; days: number }> = [
    { code: "task_streak_3", days: 3 },
    { code: "task_streak_7", days: 7 },
  ]

  for (const check of taskStreakChecks) {
    if (!unlockedCodes.has(check.code) && taskStreak >= check.days) {
      const def = ACHIEVEMENTS.find((a) => a.code === check.code)!
      const result = await unlockAchievement(userId, childId, def)
      if (result) newAchievements.push(result)
    }
  }

  // all_types: 完成3种不同类型的任务
  if (!unlockedCodes.has("all_types")) {
    const taskTypes = await db.task.findMany({
      where: { childId, status: "COMPLETED" },
      select: { taskType: true },
      distinct: ["taskType"],
    })
    if (taskTypes.length >= 3) {
      const result = await unlockAchievement(userId, childId, ACHIEVEMENTS.find((a) => a.code === "all_types")!)
      if (result) newAchievements.push(result)
    }
  }

  // points_100 / points_500: 累计积分
  const totalPoints = await db.point.aggregate({
    where: { childId },
    _sum: { amount: true },
  })
  const points = totalPoints._sum.amount ?? 0

  const pointsChecks: Array<{ code: string; value: number }> = [
    { code: "points_100", value: 100 },
    { code: "points_500", value: 500 },
  ]

  for (const check of pointsChecks) {
    if (!unlockedCodes.has(check.code) && points >= check.value) {
      const def = ACHIEVEMENTS.find((a) => a.code === check.code)!
      const result = await unlockAchievement(userId, childId, def)
      if (result) newAchievements.push(result)
    }
  }

  return newAchievements
}

/** 检查知识类成就 */
async function checkKnowledgeAchievements(userId: string, childId: string) {
  const newAchievements: Array<AchievementDef & { unlockedAt: string }> = []

  // 获取当前用户的 userId
  const child = await db.child.findUnique({ where: { id: childId }, select: { userId: true } })
  if (!child) return newAchievements

  const unlocked = await db.userAchievement.findMany({
    where: {
      childId,
      achievement: { category: "KNOWLEDGE" },
    },
    include: { achievement: true },
  })
  const unlockedCodes = new Set(unlocked.map((u) => u.achievement.code))

  // 计算该用户阅读的文章数（通过收藏记录推断，因为没有单独的阅读记录表）
  // 实际项目中可能有阅读记录表，这里用收藏数近似
  const favoriteCount = await db.favorite.count({ where: { userId: child.userId } })

  // first_article: 首次阅读（用收藏推断）
  if (!unlockedCodes.has("first_article") && favoriteCount >= 1) {
    const result = await unlockAchievement(userId, childId, ACHIEVEMENTS.find((a) => a.code === "first_article")!)
    if (result) newAchievements.push(result)
  }

  // articles_5 / articles_10
  const articleChecks: Array<{ code: string; value: number }> = [
    { code: "articles_5", value: 5 },
    { code: "articles_10", value: 10 },
  ]

  for (const check of articleChecks) {
    if (!unlockedCodes.has(check.code) && favoriteCount >= check.value) {
      const def = ACHIEVEMENTS.find((a) => a.code === check.code)!
      const result = await unlockAchievement(userId, childId, def)
      if (result) newAchievements.push(result)
    }
  }

  // first_favorite: 首次收藏
  if (!unlockedCodes.has("first_favorite") && favoriteCount >= 1) {
    const result = await unlockAchievement(userId, childId, ACHIEVEMENTS.find((a) => a.code === "first_favorite")!)
    if (result) newAchievements.push(result)
  }

  return newAchievements
}

/** POST /api/achievements/check - 检查并解锁成就 */
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "请先登录" } },
      { status: 401 }
    )
  }

  const body: CheckRequest = await request.json()
  const { childId, event } = body

  if (!childId || !event) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "参数不完整" } },
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

  const userId = session.user.id
  let newAchievements: Array<AchievementDef & { unlockedAt: string }> = []

  try {
    // 根据事件类型检查对应分类的成就
    switch (event) {
      case "assessment":
        newAchievements = await checkAssessmentAchievements(userId, childId)
        break
      case "checkin":
        newAchievements = await checkCheckinAchievements(userId, childId)
        break
      case "task_complete":
        newAchievements = await checkTaskAchievements(userId, childId)
        break
      case "milestone":
        // 里程碑事件也检查打卡类成就中的 first_milestone
        newAchievements = await checkCheckinAchievements(userId, childId)
        break
      case "article_read":
      case "favorite":
        newAchievements = await checkKnowledgeAchievements(userId, childId)
        break
    }

    return NextResponse.json({
      success: true,
      data: { newAchievements },
    })
  } catch (error) {
    console.error("成就检查失败:", error)
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "成就检查失败" } },
      { status: 500 }
    )
  }
}
