/** 连续天数计算 + 积分计算 */

/** 计算连续天数（从今天往回数） */
export function calculateStreak(
  dates: Array<{ date: Date }>,
  today: Date
): number {
  const todayStart = new Date(today)
  todayStart.setHours(0, 0, 0, 0)

  let streak = 0
  const current = new Date(todayStart)

  for (const d of dates) {
    const checkDate = new Date(d.date)
    checkDate.setHours(0, 0, 0, 0)
    const diffDays = Math.floor(
      (current.getTime() - checkDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    if (diffDays === streak) {
      streak++
    } else {
      break
    }
  }

  return streak
}

/** 打卡积分：基础 1 分 + 连续奖励（上限 7） */
export function calculateCheckinPoints(streak: number) {
  const base = 1
  const bonus = Math.min(streak, 7)
  return { base, bonus, total: base + bonus }
}

/** 任务积分：基础 2 分 + 连续奖励（上限 7） */
export function calculateTaskPoints(streak: number) {
  const base = 2
  const bonus = Math.min(streak, 7)
  return { base, bonus, total: base + bonus }
}
