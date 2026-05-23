import dayjs from "dayjs"
import { TASK_TEMPLATES } from "@/constants/taskTemplates"
import type { TrainingPhase, TaskType } from "@/types/task"
import type { Dimension } from "@/types/assessment"

interface GenerateTasksParams {
  childId: string
  phase: TrainingPhase
  weakDimensions: Dimension[]
  recentTemplateIds: string[]
  existingTemplateIds: string[]
}

interface GeneratedTask {
  childId: string
  phase: TrainingPhase
  taskType: TaskType
  templateId: string
  title: string
  description: string
  duration: number | null
  scheduledDate: Date
}

/** 评估记录（从 DB 查询的原始数据） */
interface AssessmentRecord {
  dimension: string
  score: number
}

/** 有效的评估维度列表 */
const VALID_DIMENSIONS: Dimension[] = ["PHYSICAL", "LIFE", "SOCIAL", "LEARNING"]

/** 各阶段每日任务数量 */
const TASK_COUNT: Record<TrainingPhase, number> = {
  PHASE_1: 3,
  PHASE_2: 4,
  PHASE_3: 5,
}

/** 必须包含的任务类型（保底多样性） */
const REQUIRED_TYPES: TaskType[] = ["HABIT", "ABILITY", "BONDING"]

/**
 * 从评估结果中识别薄弱维度
 * 取每个维度的最新分数，排序后返回最低的 1-2 个
 * 分数 < 60 的优先返回
 */
export function findWeakDimensions(
  assessments: AssessmentRecord[]
): Dimension[] {
  if (assessments.length === 0) return []

  // 按维度取最新分数（数据已按 createdAt desc 排序，第一个就是最新的）
  const scoreMap = new Map<Dimension, number>()
  for (const a of assessments) {
    if (!VALID_DIMENSIONS.includes(a.dimension as Dimension)) continue
    const dim = a.dimension as Dimension
    if (!scoreMap.has(dim)) {
      scoreMap.set(dim, a.score)
    }
  }

  // 转为数组并排序（分数升序）
  const sorted = [...scoreMap.entries()].sort((a, b) => a[1] - b[1])

  // 优先返回 < 60 分的维度
  const critical = sorted.filter(([, score]) => score < 60)
  if (critical.length >= 1) {
    return critical.slice(0, 2).map(([dim]) => dim)
  }

  // 没有 < 60 的，返回最低的 1 个
  return sorted.length > 0 ? [sorted[0][0]] : []
}

/**
 * 智能生成每日任务
 * 算法：
 * 1. 按阶段筛选模板（phase 匹配 + "ALL"）
 * 2. 排除近 7 天已用和今天已有的模板
 * 3. 薄弱维度模板标记为高优先级
 * 4. 保底类型多样性：至少 1 HABIT + 1 ABILITY + 1 BONDING
 * 5. 按阶段确定数量：PHASE_1=3, PHASE_2=4, PHASE_3=5
 */
export function generateDailyTasks(params: GenerateTasksParams): GeneratedTask[] {
  const { childId, phase, weakDimensions, recentTemplateIds, existingTemplateIds } = params

  // 排除的模板 ID 集合
  const excludeIds = new Set([...recentTemplateIds, ...existingTemplateIds])

  // 1. 按阶段筛选可用模板
  const available = TASK_TEMPLATES.filter(
    t => (t.phase === phase || t.phase === "ALL") && !excludeIds.has(t.id)
  )

  if (available.length === 0) return []

  const targetCount = TASK_COUNT[phase]
  const scheduledDate = dayjs().startOf("day").toDate()

  // 2. 标记高优先级（薄弱维度）
  const weakSet = new Set(weakDimensions)
  const scored = available.map(template => ({
    template,
    isWeak: weakSet.has(template.dimension as Dimension) && VALID_DIMENSIONS.includes(template.dimension as Dimension),
    // 随机扰动，保证每天任务不完全相同
    random: Math.random(),
  }))

  // 3. 排序：薄弱维度优先 → 随机
  scored.sort((a, b) => {
    if (a.isWeak !== b.isWeak) return a.isWeak ? -1 : 1
    return a.random - b.random
  })

  // 4. 保底选择：确保每种必需类型至少有 1 个
  const selected: typeof scored = []
  const selectedIds = new Set<string>()

  for (const type of REQUIRED_TYPES) {
    const candidate = scored.find(
      s => s.template.type === type && !selectedIds.has(s.template.id)
    )
    if (candidate) {
      selected.push(candidate)
      selectedIds.add(candidate.template.id)
    }
  }

  // 5. 补充剩余名额
  for (const item of scored) {
    if (selected.length >= targetCount) break
    if (!selectedIds.has(item.template.id)) {
      selected.push(item)
      selectedIds.add(item.template.id)
    }
  }

  // 6. 转换为 GeneratedTask
  return selected.map(({ template }) => ({
    childId,
    phase,
    taskType: template.type,
    templateId: template.id,
    title: template.title,
    description: template.description,
    duration: template.duration,
    scheduledDate,
  }))
}
