import dayjs from "dayjs"
import type { TrainingPhase } from "@/types/task"

/**
 * 根据孩子生日计算当前训练阶段
 * 入学时间推断：孩子满 6 岁后的 9 月 1 日
 * PHASE_1: 入学前 3 个月 ~ 入学前 1 个月
 * PHASE_2: 入学前 1 个月 ~ 入学前 2 周
 * PHASE_3: 入学前 2 周 ~ 入学
 * 如果已过入学日期，返回 null（已入学）
 */
export function getCurrentPhase(birthday: Date | string): TrainingPhase | null {
  const birth = dayjs(birthday)

  // 计算入学年份：满 6 岁那年的 9 月 1 日
  // 如果生日在 9 月 1 日之后，需要延后一年入学
  let enrollYear = birth.add(6, "year").year()
  if (birth.month() > 8 || (birth.month() === 8 && birth.date() > 1)) {
    enrollYear += 1
  }
  const enrollDate = dayjs(`${enrollYear}-09-01`)

  // 如果已过入学日期，返回 null
  const today = dayjs().startOf("day")
  if (today.isAfter(enrollDate) || today.isSame(enrollDate)) {
    return null
  }

  const daysUntilEnroll = enrollDate.diff(today, "day")

  // > 30 天 = PHASE_1, 15-30 天 = PHASE_2, 0-14 天 = PHASE_3
  if (daysUntilEnroll > 30) {
    return "PHASE_1"
  }
  if (daysUntilEnroll >= 15) {
    return "PHASE_2"
  }
  return "PHASE_3"
}
