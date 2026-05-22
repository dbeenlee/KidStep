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

  /** 初始化任务队列 */
  initQueue: (tasks: TaskItem[]) => void
  /** 完成当前任务 */
  completeCurrent: () => void
  /** 跳过当前任务 */
  skipCurrent: () => void
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

  completeCurrent: () => {
    const { queue, currentIndex, summary } = get()
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
  },

  skipCurrent: () => {
    const { queue, currentIndex, summary } = get()
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
  },

  updateSummary: summary => set({ summary }),
}))
