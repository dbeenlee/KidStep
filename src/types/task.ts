/** 任务类型 */
export type TaskType = "HABIT" | "ABILITY" | "BONDING" | "KNOWLEDGE"

/** 训练阶段 */
export type TrainingPhase = "PHASE_1" | "PHASE_2" | "PHASE_3"

/** 任务模板 */
export interface TaskTemplate {
  id: string
  title: string
  description: string
  type: TaskType
  dimension: "PHYSICAL" | "LIFE" | "SOCIAL" | "LEARNING"
  phase: TrainingPhase | "ALL"
  duration: number
  difficulty: 1 | 2 | 3
}

/** 单任务状态 */
export type TaskQueueStatus = "idle" | "loading" | "inProgress" | "completed"

/** 今日任务汇总 */
export interface TodaySummary {
  total: number
  completed: number
  skipped: number
  pending: number
}
