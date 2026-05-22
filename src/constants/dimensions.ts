/** 四个评估维度的显示配置 */
export const DIMENSION_CONFIG = {
  PHYSICAL: {
    label: "身心准备",
    color: "#4CAF50",
    icon: "💪",
    bgColor: "#E8F5E9",
  },
  LIFE: {
    label: "生活准备",
    color: "#FF9800",
    icon: "🏠",
    bgColor: "#FFF3E0",
  },
  SOCIAL: {
    label: "社会准备",
    color: "#2196F3",
    icon: "🤝",
    bgColor: "#E3F2FD",
  },
  LEARNING: {
    label: "学习准备",
    color: "#9C27B0",
    icon: "📚",
    bgColor: "#F3E5F5",
  },
} as const

/** 分数颜色区间 */
export const SCORE_COLORS = {
  excellent: { min: 80, max: 100, color: "#4CAF50", label: "优秀" },
  good: { min: 60, max: 79, color: "#FFC107", label: "良好" },
  fair: { min: 40, max: 59, color: "#FF9800", label: "一般" },
  weak: { min: 0, max: 39, color: "#F44336", label: "待提升" },
} as const

/** 品牌色 */
export const BRAND_COLORS = {
  primary: "#4CAF50",
  secondary: "#FF9800",
  accent: "#FFD700",
  background: "#FFF8E1",
} as const

/** 根据分数获取颜色 */
export function getScoreColor(score: number): string {
  if (score >= 80) return SCORE_COLORS.excellent.color
  if (score >= 60) return SCORE_COLORS.good.color
  if (score >= 40) return SCORE_COLORS.fair.color
  return SCORE_COLORS.weak.color
}

/** 根据分数获取等级标签 */
export function getScoreLabel(score: number): string {
  if (score >= 80) return SCORE_COLORS.excellent.label
  if (score >= 60) return SCORE_COLORS.good.label
  if (score >= 40) return SCORE_COLORS.fair.label
  return SCORE_COLORS.weak.label
}
