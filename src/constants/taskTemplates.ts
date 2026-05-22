import { type TaskTemplate } from "@/types/task"

/**
 * 训练任务模板库
 * 完整50个模板详见 docs/任务模板库.md
 * 此处为精简版，包含15个核心模板用于MVP开发
 */
export const TASK_TEMPLATES: TaskTemplate[] = [
  // ==================== 习惯类 (HABIT) ====================
  {
    id: "habit-001",
    title: "早起打卡",
    description: "7:00前起床，自己穿衣服",
    type: "HABIT",
    dimension: "LIFE",
    phase: "ALL",
    duration: 1,
    difficulty: 1,
  },
  {
    id: "habit-002",
    title: "阅读打卡",
    description: "亲子共读一本绘本，至少15分钟",
    type: "HABIT",
    dimension: "LEARNING",
    phase: "ALL",
    duration: 15,
    difficulty: 1,
  },
  {
    id: "habit-003",
    title: "运动打卡",
    description: "户外运动30分钟（跑步/跳绳/球类）",
    type: "HABIT",
    dimension: "PHYSICAL",
    phase: "ALL",
    duration: 30,
    difficulty: 1,
  },
  {
    id: "habit-004",
    title: "早睡打卡",
    description: "21:00前上床，准备睡觉",
    type: "HABIT",
    dimension: "LIFE",
    phase: "ALL",
    duration: 1,
    difficulty: 1,
  },
  // ==================== 能力类 (ABILITY) ====================
  {
    id: "ability-001",
    title: "舒尔特方格",
    description: "用舒尔特方格训练专注力，完成3次5×5方格",
    type: "ABILITY",
    dimension: "LEARNING",
    phase: "ALL",
    duration: 10,
    difficulty: 2,
  },
  {
    id: "ability-002",
    title: "控笔练习",
    description: "连线/描红/涂色，练习握笔和手部控制",
    type: "ABILITY",
    dimension: "LEARNING",
    phase: "PHASE_1",
    duration: 10,
    difficulty: 1,
  },
  {
    id: "ability-003",
    title: "跳绳练习",
    description: "练习跳绳，目标连续10个以上",
    type: "ABILITY",
    dimension: "PHYSICAL",
    phase: "ALL",
    duration: 15,
    difficulty: 2,
  },
  {
    id: "ability-004",
    title: "整理书包",
    description: "按类别整理书包：书本、文具、水壶",
    type: "ABILITY",
    dimension: "LIFE",
    phase: "PHASE_2",
    duration: 5,
    difficulty: 1,
  },
  {
    id: "ability-005",
    title: "指令听从",
    description: "家长说2-3个连续指令，孩子依次执行",
    type: "ABILITY",
    dimension: "LEARNING",
    phase: "PHASE_1",
    duration: 10,
    difficulty: 1,
  },
  // ==================== 亲子类 (BONDING) ====================
  {
    id: "bonding-001",
    title: "亲子共读",
    description: "一起读一本绘本，读完讨论故事内容",
    type: "BONDING",
    dimension: "LEARNING",
    phase: "ALL",
    duration: 20,
    difficulty: 1,
  },
  {
    id: "bonding-002",
    title: "口算游戏",
    description: "用扑克牌或积木玩10以内加减法游戏",
    type: "BONDING",
    dimension: "LEARNING",
    phase: "PHASE_1",
    duration: 15,
    difficulty: 1,
  },
  {
    id: "bonding-003",
    title: "角色扮演",
    description: "模拟上学场景：报到、上课、举手发言",
    type: "BONDING",
    dimension: "SOCIAL",
    phase: "PHASE_2",
    duration: 20,
    difficulty: 2,
  },
  {
    id: "bonding-004",
    title: "合作搭建",
    description: "一起用积木或磁力片完成一个作品",
    type: "BONDING",
    dimension: "SOCIAL",
    phase: "PHASE_1",
    duration: 20,
    difficulty: 1,
  },
  // ==================== 知识类 (KNOWLEDGE) ====================
  {
    id: "knowledge-001",
    title: "识字练习",
    description: "在生活中认识5个新字（路牌、包装、菜单）",
    type: "KNOWLEDGE",
    dimension: "LEARNING",
    phase: "PHASE_1",
    duration: 10,
    difficulty: 1,
  },
  {
    id: "knowledge-002",
    title: "数量配对",
    description: "指物数数，说出总数，练习数量对应",
    type: "KNOWLEDGE",
    dimension: "LEARNING",
    phase: "PHASE_1",
    duration: 10,
    difficulty: 1,
  },
]

/** 按类型获取任务模板 */
export function getTemplatesByType(type: string): TaskTemplate[] {
  return TASK_TEMPLATES.filter(t => t.type === type)
}

/** 按阶段获取任务模板 */
export function getTemplatesByPhase(
  phase: string
): TaskTemplate[] {
  return TASK_TEMPLATES.filter(
    t => t.phase === phase || t.phase === "ALL"
  )
}
