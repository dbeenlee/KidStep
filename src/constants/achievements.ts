/**
 * 成就系统常量定义
 * 包含所有 20 个成就的定义
 */

export type AchievementCategory = "ASSESSMENT" | "CHECKIN" | "TASK" | "KNOWLEDGE"

export type AchievementConditionType = "first" | "count" | "streak" | "score"

export interface AchievementCondition {
  type: AchievementConditionType
  value?: number
}

export interface AchievementDef {
  code: string
  title: string
  description: string
  icon: string
  category: AchievementCategory
  condition: AchievementCondition
}

/** 全部成就定义（20个） */
export const ACHIEVEMENTS: AchievementDef[] = [
  // ==================== 评估类 (3个) ====================
  {
    code: "first_assessment",
    title: "初识宝贝",
    description: "完成首次能力评估",
    icon: "ClipboardCheck",
    category: "ASSESSMENT",
    condition: { type: "first" },
  },
  {
    code: "all_dimensions",
    title: "全面发展",
    description: "完成全部4个维度的评估",
    icon: "LayoutGrid",
    category: "ASSESSMENT",
    condition: { type: "count", value: 4 },
  },
  {
    code: "score_excellent",
    title: "卓越表现",
    description: "任意单维度评估得分≥90",
    icon: "Trophy",
    category: "ASSESSMENT",
    condition: { type: "score", value: 90 },
  },

  // ==================== 打卡类 (5个) ====================
  {
    code: "first_checkin",
    title: "迈出第一步",
    description: "完成首次打卡",
    icon: "Footprints",
    category: "CHECKIN",
    condition: { type: "first" },
  },
  {
    code: "streak_3",
    title: "初显坚持",
    description: "连续打卡3天",
    icon: "Flame",
    category: "CHECKIN",
    condition: { type: "streak", value: 3 },
  },
  {
    code: "streak_7",
    title: "一周不辍",
    description: "连续打卡7天",
    icon: "Calendar",
    category: "CHECKIN",
    condition: { type: "streak", value: 7 },
  },
  {
    code: "streak_30",
    title: "月度达人",
    description: "连续打卡30天",
    icon: "Crown",
    category: "CHECKIN",
    condition: { type: "streak", value: 30 },
  },
  {
    code: "first_milestone",
    title: "成长瞬间",
    description: "记录首个成长里程碑",
    icon: "Flag",
    category: "CHECKIN",
    condition: { type: "first" },
  },

  // ==================== 任务类 (7个) ====================
  {
    code: "first_task",
    title: "任务启航",
    description: "完成首个训练任务",
    icon: "Rocket",
    category: "TASK",
    condition: { type: "first" },
  },
  {
    code: "tasks_10",
    title: "小有成就",
    description: "累计完成10个任务",
    icon: "Target",
    category: "TASK",
    condition: { type: "count", value: 10 },
  },
  {
    code: "tasks_50",
    title: "任务达人",
    description: "累计完成50个任务",
    icon: "Medal",
    category: "TASK",
    condition: { type: "count", value: 50 },
  },
  {
    code: "task_streak_3",
    title: "任务坚持者",
    description: "连续3天完成任务",
    icon: "Zap",
    category: "TASK",
    condition: { type: "streak", value: 3 },
  },
  {
    code: "task_streak_7",
    title: "任务铁人",
    description: "连续7天完成任务",
    icon: "Shield",
    category: "TASK",
    condition: { type: "streak", value: 7 },
  },
  {
    code: "all_types",
    title: "全能选手",
    description: "完成3种不同类型的任务",
    icon: "Layers",
    category: "TASK",
    condition: { type: "count", value: 3 },
  },
  {
    code: "points_100",
    title: "百分少年",
    description: "累计积分达到100",
    icon: "Star",
    category: "TASK",
    condition: { type: "count", value: 100 },
  },
  {
    code: "points_500",
    title: "积分大师",
    description: "累计积分达到500",
    icon: "Gem",
    category: "TASK",
    condition: { type: "count", value: 500 },
  },

  // ==================== 知识类 (4个) ====================
  {
    code: "first_article",
    title: "求知若渴",
    description: "阅读首篇知识文章",
    icon: "BookOpen",
    category: "KNOWLEDGE",
    condition: { type: "first" },
  },
  {
    code: "articles_5",
    title: "博览群书",
    description: "累计阅读5篇文章",
    icon: "Library",
    category: "KNOWLEDGE",
    condition: { type: "count", value: 5 },
  },
  {
    code: "articles_10",
    title: "知识渊博",
    description: "累计阅读10篇文章",
    icon: "GraduationCap",
    category: "KNOWLEDGE",
    condition: { type: "count", value: 10 },
  },
  {
    code: "first_favorite",
    title: "珍藏好文",
    description: "首次收藏文章",
    icon: "Heart",
    category: "KNOWLEDGE",
    condition: { type: "first" },
  },
]

/** 根据 code 获取成就定义 */
export function getAchievementByCode(code: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.code === code)
}

/** 按分类获取成就 */
export function getAchievementsByCategory(category: AchievementCategory): AchievementDef[] {
  return ACHIEVEMENTS.filter((a) => a.category === category)
}
