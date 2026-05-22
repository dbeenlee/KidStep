import { type Question } from "@/types/assessment"

/**
 * 评估题库 - 4维度 × 10题 = 40题
 * 评分标准：A=5分(最好) B=3分(较好) C=1分(一般) D=0分(需提升)
 *
 * 完整题库详见 docs/评估题库.md
 * 此处为精简版，包含每维度3道示例题，共12题用于MVP开发
 */
export const QUESTIONS: Question[] = [
  // ==================== 身心准备 ====================
  {
    id: "PHY-001",
    dimension: "PHYSICAL",
    category: "运动能力",
    question: "孩子是否能连续跳绳10个以上？",
    options: [
      { key: "A", text: "能，且很轻松", score: 5 },
      { key: "B", text: "能，但需要多练习", score: 3 },
      { key: "C", text: "只能跳1-2个", score: 1 },
      { key: "D", text: "完全不会", score: 0 },
    ],
    tips: "跳绳是很多小学的考核项目之一，建议每天练习5-10分钟",
    relatedArticle: "体育：每天运动1-2小时",
  },
  {
    id: "PHY-002",
    dimension: "PHYSICAL",
    category: "精细动作",
    question: "孩子握笔姿势是否正确？",
    options: [
      { key: "A", text: "姿势标准，能画简单线条", score: 5 },
      { key: "B", text: "基本正确，偶尔需要纠正", score: 3 },
      { key: "C", text: "握笔方式不太对", score: 1 },
      { key: "D", text: "还不会握笔", score: 0 },
    ],
    tips: "正确握笔需要拇指、食指、中指三指配合，可以用三角铅笔辅助训练",
  },
  {
    id: "PHY-003",
    dimension: "PHYSICAL",
    category: "情绪管理",
    question: "孩子遇到不开心的事时，通常如何表达？",
    options: [
      { key: "A", text: "能用语言清楚表达感受", score: 5 },
      { key: "B", text: "能说出来，但有时会哭闹", score: 3 },
      { key: "C", text: "主要通过哭闹表达", score: 1 },
      { key: "D", text: "不表达，闷在心里", score: 0 },
    ],
    tips: "情绪表达能力对入学适应非常重要，可以在日常生活中多引导孩子描述感受",
    relatedArticle: "如何缓解入学焦虑",
  },
  // ==================== 生活准备 ====================
  {
    id: "LIF-001",
    dimension: "LIFE",
    category: "作息规律",
    question: "孩子能否做到按时起床和睡觉？",
    options: [
      { key: "A", text: "每天规律作息，不需要提醒", score: 5 },
      { key: "B", text: "基本规律，偶尔需要提醒", score: 3 },
      { key: "C", text: "经常需要催促", score: 1 },
      { key: "D", text: "作息很不规律", score: 0 },
    ],
    tips: "入学后需要7:00左右起床，建议提前2周开始调整作息",
    relatedArticle: "三阶段训练方案详解",
  },
  {
    id: "LIF-002",
    dimension: "LIFE",
    category: "自理能力",
    question: "孩子能否独立穿衣、系鞋带？",
    options: [
      { key: "A", text: "完全独立完成", score: 5 },
      { key: "B", text: "能穿衣服，鞋带还需要帮忙", score: 3 },
      { key: "C", text: "需要较多帮助", score: 1 },
      { key: "D", text: "完全依赖成人", score: 0 },
    ],
    tips: "可以选择魔术贴鞋子，减少入学初期的焦虑",
  },
  {
    id: "LIF-003",
    dimension: "LIFE",
    category: "整理习惯",
    question: "孩子能否自己整理书包和文具？",
    options: [
      { key: "A", text: "能按类别整理，很有条理", score: 5 },
      { key: "B", text: "能整理，但需要提醒", score: 3 },
      { key: "C", text: "需要大人帮忙", score: 1 },
      { key: "D", text: "完全没有整理意识", score: 0 },
    ],
    tips: "可以和孩子一起玩'整理书包比赛'游戏，培养整理习惯",
    relatedArticle: "开学前两周 checklist",
  },
  // ==================== 社会准备 ====================
  {
    id: "SOC-001",
    dimension: "SOCIAL",
    category: "规则意识",
    question: "孩子在集体活动中能否遵守排队、轮流等规则？",
    options: [
      { key: "A", text: "主动遵守，不需要提醒", score: 5 },
      { key: "B", text: "基本遵守，偶尔需要提醒", score: 3 },
      { key: "C", text: "经常需要提醒", score: 1 },
      { key: "D", text: "很难遵守规则", score: 0 },
    ],
    tips: "规则意识是社会准备的核心，可以通过棋类游戏、角色扮演来训练",
    relatedArticle: "社交能力这样练",
  },
  {
    id: "SOC-002",
    dimension: "SOCIAL",
    category: "社交技能",
    question: "孩子能否主动和同伴交往，说出'我能和你一起玩吗'？",
    options: [
      { key: "A", text: "能主动发起交往", score: 5 },
      { key: "B", text: "有时能，有时需要鼓励", score: 3 },
      { key: "C", text: "通常需要大人引导", score: 1 },
      { key: "D", text: "比较害羞，不愿交往", score: 0 },
    ],
    tips: "社交能力需要在真实场景中练习，多带孩子参加集体活动",
  },
  {
    id: "SOC-003",
    dimension: "SOCIAL",
    category: "抗挫能力",
    question: "孩子在游戏中输了时，通常如何反应？",
    options: [
      { key: "A", text: "能接受结果，继续玩", score: 5 },
      { key: "B", text: "有点不开心，但能接受", score: 3 },
      { key: "C", text: "会哭闹或发脾气", score: 1 },
      { key: "D", text: "完全不能接受输", score: 0 },
    ],
    tips: "棋类游戏（五子棋、飞行棋）是训练抗挫能力的好方法",
  },
  // ==================== 学习准备 ====================
  {
    id: "LRN-001",
    dimension: "LEARNING",
    category: "专注力",
    question: "孩子能否安静地听故事或做一件事持续15分钟以上？",
    options: [
      { key: "A", text: "能专注20分钟以上", score: 5 },
      { key: "B", text: "能专注15分钟左右", score: 3 },
      { key: "C", text: "只能专注5-10分钟", score: 1 },
      { key: "D", text: "很难安静坐下来", score: 0 },
    ],
    tips: "专注力可以通过舒尔特方格、定时阅读来训练，从5分钟开始逐步延长",
    relatedArticle: "专注力训练方法大全",
  },
  {
    id: "LRN-002",
    dimension: "LEARNING",
    category: "阅读兴趣",
    question: "孩子是否喜欢听故事、看绘本？",
    options: [
      { key: "A", text: "非常喜欢，每天主动要求读", score: 5 },
      { key: "B", text: "喜欢，但需要大人引导", score: 3 },
      { key: "C", text: "兴趣一般，偶尔看看", score: 1 },
      { key: "D", text: "不喜欢，坐不住", score: 0 },
    ],
    tips: "每日亲子共读15-20分钟是最好的阅读启蒙方式",
    relatedArticle: "语文：兴趣为先，习惯为重",
  },
  {
    id: "LRN-003",
    dimension: "LEARNING",
    category: "数感基础",
    question: "孩子能否理解10以内数量的分解与组合？",
    options: [
      { key: "A", text: "理解并能灵活运用", score: 5 },
      { key: "B", text: "基本理解，偶尔需要提示", score: 3 },
      { key: "C", text: "能数数，但不太理解分解", score: 1 },
      { key: "D", text: "还不会数10以内的数", score: 0 },
    ],
    tips: "用积木、扑克牌在生活中渗透数学，比刷题更有效",
    relatedArticle: "数学：在生活中培养数感",
  },
]

/** 按维度分组获取题目 */
export function getQuestionsByDimension(
  dimension: string
): Question[] {
  return QUESTIONS.filter(q => q.dimension === dimension)
}
