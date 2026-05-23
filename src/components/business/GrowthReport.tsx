"use client"

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer"
import { DIMENSION_CONFIG, getScoreLabel } from "@/constants/dimensions"

// 注册思源黑体以支持中文显示
Font.register({
  family: "NotoSansSC",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/notosanssc/v36/k3kCo84MPvpLmixcA63oeAL7Iqp5IZJF9bmaG9_FnYxNbPzS5HE.woff2",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/notosanssc/v36/k3kCo84MPvpLmixcA63oeAL7Iqp5IZJF9bmaG9_FnYxNbPzS5HE.woff2",
      fontWeight: 700,
    },
  ],
})

/** 报告数据类型 */
interface ReportData {
  child: {
    name: string
    birthday: string
    targetSchool: string | null
  }
  assessments: {
    dimension: string
    score: number
    createdAt: string
  }[]
  milestones: {
    type: string
    content: string | null
    mediaUrls: string | null
    createdAt: string
  }[]
  totalPoints: number
  streak: number
}

/** 维度键类型 */
type DimensionKey = keyof typeof DIMENSION_CONFIG

/** 维度排序顺序 */
const DIMENSION_ORDER: DimensionKey[] = ["PHYSICAL", "LIFE", "SOCIAL", "LEARNING"]

/** 样式表 */
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "NotoSansSC",
    fontSize: 11,
    color: "#333",
    lineHeight: 1.6,
  },
  // 封面页
  cover: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF8E1",
  },
  coverTitle: {
    fontSize: 32,
    fontWeight: 700,
    color: "#4CAF50",
    marginBottom: 8,
  },
  coverSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 40,
  },
  coverChildName: {
    fontSize: 28,
    fontWeight: 700,
    color: "#333",
    marginBottom: 12,
  },
  coverInfo: {
    fontSize: 12,
    color: "#666",
    marginBottom: 6,
  },
  coverDate: {
    fontSize: 11,
    color: "#999",
    marginTop: 40,
  },
  coverBrand: {
    fontSize: 10,
    color: "#4CAF50",
    marginTop: 8,
  },
  // 内容页标题
  pageTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: "#4CAF50",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: "#4CAF50",
    borderBottomStyle: "solid",
  },
  // 表格
  table: {
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    borderBottomStyle: "solid",
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tableHeader: {
    backgroundColor: "#F5F5F5",
    fontWeight: 700,
  },
  tableCol1: {
    width: "25%",
    fontSize: 11,
  },
  tableCol2: {
    width: "25%",
    fontSize: 11,
    textAlign: "center",
  },
  tableCol3: {
    width: "25%",
    fontSize: 11,
    textAlign: "center",
  },
  tableCol4: {
    width: "25%",
    fontSize: 11,
    textAlign: "center",
  },
  // 统计卡片
  statsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFF8E1",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: 700,
    color: "#4CAF50",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: "#666",
  },
  // 里程碑时间轴
  monthGroup: {
    marginBottom: 16,
  },
  monthLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: "#4CAF50",
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#E8F5E9",
    borderBottomStyle: "solid",
  },
  milestoneItem: {
    flexDirection: "row",
    marginBottom: 8,
    paddingLeft: 12,
  },
  milestoneDate: {
    width: 50,
    fontSize: 10,
    color: "#999",
  },
  milestoneType: {
    width: 60,
    fontSize: 10,
    color: "#FF9800",
  },
  milestoneContent: {
    flex: 1,
    fontSize: 10,
    color: "#333",
  },
  // 建议列表
  suggestionItem: {
    flexDirection: "row",
    marginBottom: 12,
    paddingLeft: 8,
  },
  suggestionIndex: {
    width: 20,
    fontSize: 12,
    fontWeight: 700,
    color: "#4CAF50",
  },
  suggestionText: {
    flex: 1,
    fontSize: 11,
    color: "#333",
  },
  // 页脚
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 9,
    color: "#999",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    borderTopStyle: "solid",
    paddingTop: 8,
  },
  // 空状态
  emptyText: {
    fontSize: 11,
    color: "#999",
    textAlign: "center",
    paddingVertical: 20,
  },
  // 分数高亮
  scoreGood: {
    color: "#4CAF50",
    fontWeight: 700,
  },
  scoreFair: {
    color: "#FF9800",
    fontWeight: 700,
  },
  scoreWeak: {
    color: "#F44336",
    fontWeight: 700,
  },
})

/** 里程碑类型标签 */
const MILESTONE_TYPE_LABELS: Record<string, string> = {
  TEXT: "文字",
  PHOTO: "照片",
  ASSESSMENT: "评估",
}

/** 根据分数获取样式 */
function getScoreStyle(score: number) {
  if (score >= 80) return styles.scoreGood
  if (score >= 60) return styles.scoreFair
  return styles.scoreWeak
}

/** 根据最弱维度生成训练建议 */
function getSuggestions(weakestDimension: string): string[] {
  const suggestionsMap: Record<string, string[]> = {
    PHYSICAL: [
      "每天保证 1 小时户外运动，跑步、跳绳、球类均可",
      "练习精细动作：用筷子夹豆子、剪纸、穿珠子",
      "建立规律作息，保证 10 小时充足睡眠",
      "练习单脚站立、走平衡木，锻炼身体协调性",
      "学习自己系鞋带、扣纽扣，提升自理能力",
    ],
    LIFE: [
      "让孩子参与简单家务：摆碗筷、擦桌子、整理玩具",
      "练习自己穿衣、叠被、刷牙、洗脸",
      "学习看时钟，建立时间观念",
      "练习整理书包，认识自己的物品",
      "带孩子去超市购物，学习简单计算和社交",
    ],
    SOCIAL: [
      "多带孩子参加集体活动，练习与同龄人相处",
      "教孩子用语言表达需求，而非哭闹或发脾气",
      "练习轮流、分享、等待等社交技能",
      "通过角色扮演游戏学习解决冲突",
      "鼓励孩子主动打招呼、自我介绍",
    ],
    LEARNING: [
      "每天亲子阅读 15-20 分钟，培养阅读兴趣",
      "练习握笔姿势和简单书写（画直线、圆形）",
      "通过游戏学习数数、比较大小、简单加减",
      "学习认读自己的名字和常见汉字",
      "练习安静坐 15 分钟以上，培养专注力",
    ],
  }
  return suggestionsMap[weakestDimension] ?? suggestionsMap.LEARNING
}

/** 计算年龄段 */
function getAgeText(birthday: string): string {
  const birth = new Date(birthday)
  const now = new Date()
  const years = now.getFullYear() - birth.getFullYear()
  const months = now.getMonth() - birth.getMonth()
  const totalMonths = years * 12 + months

  if (totalMonths < 12) return `${totalMonths} 个月`
  const y = Math.floor(totalMonths / 12)
  const m = totalMonths % 12
  return m > 0 ? `${y} 岁 ${m} 个月` : `${y} 岁`
}

/** 格式化日期 */
function formatDate(dateStr: string): string {
  if (!dateStr) return "-"
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

/** 格式化完整日期 */
function formatFullDate(dateStr: string): string {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`
}

/** 按月分组里程碑 */
function groupMilestonesByMonth(milestones: ReportData["milestones"]) {
  const groups: Record<string, ReportData["milestones"]> = {}

  milestones.forEach(m => {
    const d = new Date(m.createdAt)
    const key = `${d.getFullYear()} 年 ${d.getMonth() + 1} 月`
    if (!groups[key]) groups[key] = []
    groups[key].push(m)
  })

  return Object.entries(groups).map(([label, items]) => ({ label, items }))
}

/** PDF 报告组件 */
export function GrowthReport({ data }: { data: ReportData }) {
  const { child, assessments, milestones, totalPoints, streak } = data

  // 找出最弱维度
  const weakestAssessment = assessments.reduce(
    (min, curr) => (curr.score < min.score ? curr : min),
    assessments[0] ?? { dimension: "LEARNING", score: 0 }
  )
  const suggestions = getSuggestions(weakestAssessment.dimension)
  const weakestLabel =
    DIMENSION_CONFIG[weakestAssessment.dimension as DimensionKey]?.label ?? "学习准备"

  // 里程碑按月分组
  const monthGroups = groupMilestonesByMonth(milestones)

  // 生成日期
  const reportDate = formatFullDate(new Date().toISOString())

  return (
    <Document>
      {/* ===== 封面页 ===== */}
      <Page size="A4" style={styles.page}>
        <View style={styles.cover}>
          <Text style={styles.coverTitle}>童行</Text>
          <Text style={styles.coverSubtitle}>幼小衔接成长报告</Text>
          <Text style={styles.coverChildName}>{child.name}</Text>
          <Text style={styles.coverInfo}>
            年龄：{getAgeText(child.birthday)}
          </Text>
          {child.targetSchool && (
            <Text style={styles.coverInfo}>
              目标学校：{child.targetSchool}
            </Text>
          )}
          <Text style={styles.coverDate}>报告生成日期：{reportDate}</Text>
          <Text style={styles.coverBrand}>
            童行 (KidStep) — 每一步，都陪你走
          </Text>
        </View>
        <Text style={styles.footer}>
          童行 (KidStep) — 每一步，都陪你走
        </Text>
      </Page>

      {/* ===== 能力概览页 ===== */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.pageTitle}>能力概览</Text>

        {/* 统计卡片 */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalPoints}</Text>
            <Text style={styles.statLabel}>累计积分</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>连续打卡（天）</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{milestones.length}</Text>
            <Text style={styles.statLabel}>成长记录</Text>
          </View>
        </View>

        {/* 四维度分数表格 */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCol1}>维度</Text>
            <Text style={styles.tableCol2}>分数</Text>
            <Text style={styles.tableCol3}>等级</Text>
            <Text style={styles.tableCol4}>状态</Text>
          </View>
          {DIMENSION_ORDER.map(dim => {
            const assessment = assessments.find(a => a.dimension === dim)
            const config = DIMENSION_CONFIG[dim]
            const score = assessment?.score ?? 0
            const label = getScoreLabel(score)
            const hasData = (assessment?.score ?? 0) > 0

            return (
              <View key={dim} style={styles.tableRow}>
                <Text style={styles.tableCol1}>
                  {config.icon} {config.label}
                </Text>
                <Text style={[styles.tableCol2, getScoreStyle(score)]}>
                  {hasData ? score : "-"}
                </Text>
                <Text style={styles.tableCol3}>
                  {hasData ? label : "未评估"}
                </Text>
                <Text style={styles.tableCol4}>
                  {hasData ? (score >= 60 ? "达标" : "需加强") : "-"}
                </Text>
              </View>
            )
          })}
        </View>

        {/* 综合评价 */}
        <View style={{ marginTop: 12 }}>
          <Text style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
            综合评价
          </Text>
          <Text style={{ fontSize: 11, color: "#555" }}>
            {child.name} 在四个维度中，{weakestLabel} 稍显薄弱，建议重点关注。
            {streak > 0
              ? `已连续打卡 ${streak} 天，坚持得很好！`
              : "建议开始每日打卡，养成好习惯。"}
            {totalPoints > 0
              ? `累计获得 ${totalPoints} 积分，继续加油！`
              : ""}
          </Text>
        </View>

        <Text style={styles.footer}>
          童行 (KidStep) — 每一步，都陪你走
        </Text>
      </Page>

      {/* ===== 里程碑时间轴页 ===== */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.pageTitle}>成长里程碑</Text>

        {monthGroups.length > 0 ? (
          monthGroups.map(group => (
            <View key={group.label} style={styles.monthGroup}>
              <Text style={styles.monthLabel}>{group.label}</Text>
              {group.items.map((item, idx) => (
                <View key={idx} style={styles.milestoneItem}>
                  <Text style={styles.milestoneDate}>
                    {formatDate(item.createdAt)}
                  </Text>
                  <Text style={styles.milestoneType}>
                    [{MILESTONE_TYPE_LABELS[item.type] ?? item.type}]
                  </Text>
                  <Text style={styles.milestoneContent}>
                    {item.content ?? "（无文字描述）"}
                  </Text>
                </View>
              ))}
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>
            暂无成长记录，快去记录第一个里程碑吧！
          </Text>
        )}

        <Text style={styles.footer}>
          童行 (KidStep) — 每一步，都陪你走
        </Text>
      </Page>

      {/* ===== 训练建议页 ===== */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.pageTitle}>训练建议</Text>

        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
            重点关注：{weakestLabel}
          </Text>
          <Text style={{ fontSize: 10, color: "#666" }}>
            根据评估结果，{weakestLabel}是 {child.name} 目前最需要加强的方面。
            以下是针对性的训练建议，每天花 15-30 分钟即可看到进步。
          </Text>
        </View>

        {suggestions.map((suggestion, idx) => (
          <View key={idx} style={styles.suggestionItem}>
            <Text style={styles.suggestionIndex}>{idx + 1}.</Text>
            <Text style={styles.suggestionText}>{suggestion}</Text>
          </View>
        ))}

        <View
          style={{
            marginTop: 30,
            padding: 16,
            backgroundColor: "#FFF8E1",
            borderRadius: 8,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
            温馨提示
          </Text>
          <Text style={{ fontSize: 10, color: "#555", lineHeight: 1.8 }}>
            - 每个孩子的发展节奏不同，分数仅供参考{"\n"}
            - 建议以游戏化的方式进行训练，避免给孩子压力{"\n"}
            - 坚持比完美更重要，每天进步一点点{"\n"}
            - 如有疑问，可咨询幼儿园老师或专业人士
          </Text>
        </View>

        <Text style={styles.footer}>
          童行 (KidStep) — 每一步，都陪你走
        </Text>
      </Page>
    </Document>
  )
}

export type { ReportData }
