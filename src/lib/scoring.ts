import { type QuizAnswer, type AssessmentReport, type RadarData } from "@/types/assessment"
import { type Question } from "@/types/assessment"
import { DIMENSION_CONFIG } from "@/constants/dimensions"

/**
 * 计算评估得分
 * 每题满分5分，N题满分5*N分，归一化到100分制
 */
export function calculateScore(answers: QuizAnswer[]): number {
  if (answers.length === 0) return 0
  const totalScore = answers.reduce((sum, a) => sum + a.score, 0)
  const maxScore = answers.length * 5
  return Math.round((totalScore / maxScore) * 100)
}

/**
 * 生成评估报告
 * 按题目分类聚合得分，取最高/最低的子分类
 */
export function generateReport(
  answers: QuizAnswer[],
  questions: Question[]
): AssessmentReport {
  // 按 category 聚合
  const categoryMap = new Map<string, number[]>()

  for (const answer of answers) {
    const question = questions.find(q => q.id === answer.questionId)
    if (!question) continue
    const existing = categoryMap.get(question.category) ?? []
    existing.push(answer.score)
    categoryMap.set(question.category, existing)
  }

  // 计算每个分类的平均分
  const categoryScores = Array.from(categoryMap.entries())
    .map(([category, scores]) => ({
      category,
      avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
    }))
    .sort((a, b) => b.avgScore - a.avgScore)

  // 取平均分最高的 2 个作为优势
  const strengths = categoryScores.slice(0, 2).map(s => s.category)

  // 取平均分最低的 2 个作为待提升，排除已选为优势的分类
  const weaknesses = categoryScores
    .filter(s => !strengths.includes(s.category))
    .slice(-2)
    .map(s => s.category)

  const suggestions = generateSuggestions(weaknesses)

  return { strengths, weaknesses, suggestions }
}

/**
 * 生成雷达图数据
 */
export function generateRadarData(
  dimensionScores: Record<string, number>
): RadarData[] {
  return Object.entries(DIMENSION_CONFIG).map(([key, config]) => ({
    dimension: config.label,
    score: dimensionScores[key] ?? 0,
    fullMark: 100,
  }))
}

/** 根据薄弱项生成建议 */
function generateSuggestions(weaknesses: string[]): string[] {
  const suggestionMap: Record<string, string[]> = {
    运动能力: ["每天安排30分钟户外运动", "从跳绳、拍球等基本运动开始"],
    精细动作: ["多做剪纸、穿珠子、连线迷宫等练习", "使用三角铅笔辅助握笔训练"],
    情绪管理: ["用情绪卡片帮助孩子识别和表达感受", "多问'你今天感觉怎么样'"],
    作息规律: ["提前2周按小学时间作息", "用沙漏或计时器可视化时间"],
    自理能力: ["每天练习自己穿衣、整理书包", "可以比赛谁穿得快"],
    整理习惯: ["给孩子一个专属收纳空间", "和孩子一起玩整理游戏"],
    规则意识: ["通过棋类游戏练习遵守规则", "角色扮演课堂场景"],
    社交技能: ["多带孩子参加集体活动", "练习说'我能和你一起玩吗'"],
    抗挫能力: ["从小游戏中体验输赢", "输了之后一起讨论感受"],
    专注力: ["用舒尔特方格训练，从5分钟开始", "减少干扰，创造安静环境"],
    阅读兴趣: ["每天亲子共读15-20分钟", "让孩子自己选书"],
    数感基础: ["在生活中渗透数学，如超市购物、分餐具", "用积木玩数量游戏"],
  }

  return weaknesses.flatMap(w => suggestionMap[w] ?? [`${w}方面需要多加练习`])
}
