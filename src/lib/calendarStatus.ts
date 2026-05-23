/** 日历状态判定 */

export interface DayCheckinStatus {
  date: string
  completedCount: number
  totalCount: number
  status: "full" | "partial" | "none" | "noTask"
}

interface TaskRecord {
  scheduledDate: Date
  status: string
}

/** 判断单日状态 */
export function getDayStatus(
  completed: number,
  total: number
): DayCheckinStatus["status"] {
  if (total === 0) return "noTask"
  if (completed === total) return "full"
  if (completed > 0) return "partial"
  return "none"
}

/** 将 Date 格式化为 YYYY-MM-DD（使用本地日期） */
function formatDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** 构建整月日历数据 */
export function buildCalendarDays(
  tasks: TaskRecord[],
  year: number,
  month: number
): DayCheckinStatus[] {
  // 按日期聚合
  const taskMap = new Map<string, { total: number; completed: number }>()
  for (const task of tasks) {
    const dateKey = formatDateKey(new Date(task.scheduledDate))
    const existing = taskMap.get(dateKey) ?? { total: 0, completed: 0 }
    existing.total++
    if (task.status === "COMPLETED") {
      existing.completed++
    }
    taskMap.set(dateKey, existing)
  }

  // 生成整月数据
  const endDate = new Date(year, month, 0)
  const daysInMonth = endDate.getDate()
  const calendar: DayCheckinStatus[] = []

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day)
    const dateKey = formatDateKey(date)
    const taskInfo = taskMap.get(dateKey)

    calendar.push({
      date: dateKey,
      completedCount: taskInfo?.completed ?? 0,
      totalCount: taskInfo?.total ?? 0,
      status: getDayStatus(taskInfo?.completed ?? 0, taskInfo?.total ?? 0),
    })
  }

  return calendar
}
