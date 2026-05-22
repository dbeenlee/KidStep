/** 评估维度 */
export type Dimension = "PHYSICAL" | "LIFE" | "SOCIAL" | "LEARNING"

/** 评估题目 */
export interface Question {
  id: string
  dimension: Dimension
  category: string
  question: string
  options: QuestionOption[]
  tips: string
  relatedArticle?: string
}

/** 题目选项 */
export interface QuestionOption {
  key: "A" | "B" | "C" | "D"
  text: string
  score: number
}

/** 答题记录 */
export interface QuizAnswer {
  questionId: string
  optionKey: string
  score: number
}

/** 评估结果 */
export interface AssessmentResult {
  dimension: Dimension
  score: number
  answers: QuizAnswer[]
  report: AssessmentReport
}

/** 评估报告 */
export interface AssessmentReport {
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
}

/** 雷达图数据 */
export interface RadarData {
  dimension: string
  score: number
  fullMark: number
}
