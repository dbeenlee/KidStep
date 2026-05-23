import { create } from "zustand"
import { type TaskQueueStatus, type TodaySummary } from "@/types/task"

interface TaskItem {
  id: string
  title: string
  description: string | null
  taskType: string
  duration: number | null
  status: string
}

/** 完成任务的返回结果 */
interface CompleteResult {
  pointsEarned: number
  encouragement: string
}

interface TaskStore {
  /** 任务队列 */
  queue: TaskItem[]
  /** 当前展示的任务索引 */
  currentIndex: number
  /** 队列状态 */
  status: TaskQueueStatus
  /** 今日汇总 */
  summary: TodaySummary

  /** 当前任务 */
  currentTask: TaskItem | null
  /** 是否全部完成 */
  allDone: boolean
  /** 操作锁，防止重复提交 */
  busy: boolean

  /** 初始化任务队列 */
  initQueue: (tasks: TaskItem[]) => void
  /** 完成当前任务（调用 API + 推进索引） */
  completeCurrent: () => Promise<CompleteResult | null>
  /** 跳过当前任务（调用 API + 推进索引） */
  skipCurrent: () => Promise<void>
  /** 更新汇总 */
  updateSummary: (summary: TodaySummary) => void
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  queue: [],
  currentIndex: 0,
  status: "idle",
  summary: { total: 0, completed: 0, skipped: 0, pending: 0 },
  currentTask: null,
  allDone: false,
  busy: false,

  initQueue: tasks => {
    const pending = tasks.filter(t => t.status === "PENDING")
    set({
      queue: pending,
      currentIndex: 0,
      currentTask: pending[0] ?? null,
      allDone: pending.length === 0,
      status: pending.length > 0 ? "inProgress" : "completed",
    })
  },

  completeCurrent: async () => {
    if (get().busy) return null
    const { queue, currentIndex, summary } = get()
    const currentTask = queue[currentIndex]
    if (!currentTask) return null

    set({ busy: true })
    try {
      const res = await fetch(`/api/tasks/${currentTask.id}/complete`, { method: "PATCH" })
      const data = await res.json()
      if (!data.success) throw new Error(data.error?.message)

      const nextIndex = currentIndex + 1
      const newSummary = {
        ...summary,
        completed: summary.completed + 1,
        pending: summary.pending - 1,
      }
      set({
        currentIndex: nextIndex,
        currentTask: queue[nextIndex] ?? null,
        allDone: nextIndex >= queue.length,
        status: nextIndex >= queue.length ? "completed" : "inProgress",
        summary: newSummary,
      })

      return {
        pointsEarned: data.data.point.amount,
        encouragement: data.data.encouragement,
      }
    } finally {
      set({ busy: false })
    }
  },

  skipCurrent: async () => {
    if (get().busy) return
    const { queue, currentIndex, summary } = get()
    const currentTask = queue[currentIndex]
    if (!currentTask) return

    set({ busy: true })
    try {
      const res = await fetch(`/api/tasks/${currentTask.id}/skip`, { method: "PATCH" })
      const data = await res.json()
      if (!data.success) throw new Error(data.error?.message)

      const nextIndex = currentIndex + 1
      const newSummary = {
        ...summary,
        skipped: summary.skipped + 1,
        pending: summary.pending - 1,
      }
      set({
        currentIndex: nextIndex,
        currentTask: queue[nextIndex] ?? null,
        allDone: nextIndex >= queue.length,
        status: nextIndex >= queue.length ? "completed" : "inProgress",
        summary: newSummary,
      })
    } finally {
      set({ busy: false })
    }
  },

  updateSummary: summary => set({ summary }),
}))
