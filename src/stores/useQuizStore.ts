import { create } from "zustand"
import { type QuizAnswer, type AssessmentReport } from "@/types/assessment"

type QuizPhase =
  | "idle"
  | "selectDimension"
  | "inProgress"
  | "completed"
  | "report"

interface QuizStore {
  /** 当前阶段 */
  phase: QuizPhase
  /** 选中的维度 */
  dimension: string | null
  /** 当前题目索引 */
  currentIndex: number
  /** 总题数 */
  totalQuestions: number
  /** 答题记录 */
  answers: QuizAnswer[]
  /** 最终得分 */
  score: number | null
  /** 评估报告 */
  report: AssessmentReport | null

  /** 开始评估 */
  startQuiz: (dimension: string, totalQuestions: number) => void
  /** 选择答案 */
  selectAnswer: (answer: QuizAnswer) => void
  /** 上一题 */
  goBack: () => void
  /** 跳过当前题 */
  skipQuestion: () => void
  /** 提交评估 */
  submit: (score: number, report: AssessmentReport) => void
  /** 重置 */
  reset: () => void
}

export const useQuizStore = create<QuizStore>((set, get) => ({
  phase: "idle",
  dimension: null,
  currentIndex: 0,
  totalQuestions: 0,
  answers: [],
  score: null,
  report: null,

  startQuiz: (dimension, totalQuestions) =>
    set({
      phase: "inProgress",
      dimension,
      currentIndex: 0,
      totalQuestions,
      answers: [],
      score: null,
      report: null,
    }),

  selectAnswer: answer => {
    const { answers, currentIndex, totalQuestions } = get()
    const newAnswers = [...answers]
    newAnswers[currentIndex] = answer

    const nextIndex = currentIndex + 1
    const isLast = nextIndex >= totalQuestions

    set({
      answers: newAnswers,
      currentIndex: isLast ? currentIndex : nextIndex,
      phase: isLast ? "completed" : "inProgress",
    })
  },

  goBack: () => {
    const { currentIndex } = get()
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1, phase: "inProgress" })
    }
  },

  skipQuestion: () => {
    const { answers, currentIndex, totalQuestions } = get()
    const newAnswers = [...answers]
    newAnswers[currentIndex] = {
      questionId: "",
      optionKey: "SKIP",
      score: 0,
    }

    const nextIndex = currentIndex + 1
    const isLast = nextIndex >= totalQuestions

    set({
      answers: newAnswers,
      currentIndex: isLast ? currentIndex : nextIndex,
      phase: isLast ? "completed" : "inProgress",
    })
  },

  submit: (score, report) =>
    set({
      phase: "report",
      score,
      report,
    }),

  reset: () =>
    set({
      phase: "idle",
      dimension: null,
      currentIndex: 0,
      totalQuestions: 0,
      answers: [],
      score: null,
      report: null,
    }),
}))
