import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { findWeakDimensions } from "@/lib/taskGenerator"
import { TASK_TEMPLATES } from "@/constants/taskTemplates"
import { DIMENSION_CONFIG } from "@/constants/dimensions"
import type { Dimension } from "@/types/assessment"

/** 弱项维度分析结果 */
interface WeakDimensionResult {
  dimension: Dimension
  score: number
  completionRate: number
  reason: string
}

/** 模板ID到维度的映射表 */
const templateDimensionMap = new Map<string, string>(
  TASK_TEMPLATES.map(t => [t.id, t.dimension])
)

/** 根据分数生成推荐理由 */
function generateReason(dimension: Dimension, score: number, completionRate: number): string {
  const config = DIMENSION_CONFIG[dimension]
  const label = config.label

  if (score < 40) {
    return `${label}得分较低（${score}分），建议重点加强相关训练`
  }
  if (score < 60) {
    if (completionRate < 0.3) {
      return `${label}有待提升（${score}分），且任务完成率偏低，建议坚持每日练习`
    }
    return `${label}处于成长期（${score}分），持续练习会有明显进步`
  }
  if (completionRate < 0.5) {
    return `${label}基础尚可（${score}分），但任务参与度不够，建议增加练习频率`
  }
  return `${label}接近达标（${score}分），再加把劲就能突破`
}

/** GET /api/tasks/weak-analysis?childId=x - 弱项分析 */
export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "请先登录" } },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  const childId = searchParams.get("childId")

  if (!childId) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "缺少 childId" } },
      { status: 400 }
    )
  }

  // 验证孩子归属
  const child = await db.child.findFirst({
    where: { id: childId, userId: session.user.id },
  })

  if (!child) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "未找到该孩子信息" } },
      { status: 404 }
    )
  }

  // 获取评估记录（最新 20 条）
  const assessments = await db.assessment.findMany({
    where: { childId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { dimension: true, score: true },
  })

  // 识别弱项维度
  const weakDimensions = findWeakDimensions(assessments)

  if (weakDimensions.length === 0) {
    return NextResponse.json({
      success: true,
      data: {
        weakDimensions: [],
        recommendations: ["各项能力均衡发展，继续保持！"],
      },
    })
  }

  // 获取该孩子的所有任务，用于计算各维度完成率
  const allTasks = await db.task.findMany({
    where: { childId },
    select: { templateId: true, status: true },
  })

  // 按维度统计任务完成情况
  const dimensionStats = new Map<Dimension, { total: number; completed: number }>()
  for (const task of allTasks) {
    const dim = templateDimensionMap.get(task.templateId) as Dimension | undefined
    if (!dim) continue

    const stats = dimensionStats.get(dim) ?? { total: 0, completed: 0 }
    stats.total++
    if (task.status === "COMPLETED") {
      stats.completed++
    }
    dimensionStats.set(dim, stats)
  }

  // 取每个弱项维度的最新分数
  const latestScoreMap = new Map<Dimension, number>()
  for (const a of assessments) {
    const dim = a.dimension as Dimension
    if (!latestScoreMap.has(dim)) {
      latestScoreMap.set(dim, a.score)
    }
  }

  // 构建弱项分析结果
  const results: WeakDimensionResult[] = weakDimensions.map(dim => {
    const score = latestScoreMap.get(dim) ?? 0
    const stats = dimensionStats.get(dim)
    const completionRate = stats && stats.total > 0
      ? Math.round((stats.completed / stats.total) * 100) / 100
      : 0
    const reason = generateReason(dim, score, completionRate)

    return {
      dimension: dim,
      score,
      completionRate,
      reason,
    }
  })

  // 生成总体推荐建议
  const recommendations: string[] = []
  const criticalDims = results.filter(r => r.score < 60)
  if (criticalDims.length > 0) {
    const labels = criticalDims.map(r => DIMENSION_CONFIG[r.dimension].label).join("、")
    recommendations.push(`${labels}需要重点关注，建议每天优先完成相关任务`)
  }

  const lowCompletionDims = results.filter(r => r.completionRate < 0.3)
  if (lowCompletionDims.length > 0) {
    recommendations.push("部分弱项任务完成率偏低，坚持打卡才能看到进步")
  }

  if (recommendations.length === 0) {
    recommendations.push("弱项正在改善中，保持当前训练节奏即可")
  }

  return NextResponse.json({
    success: true,
    data: {
      weakDimensions: results,
      recommendations,
    },
  })
}
