"use client"

import { useEffect, useRef } from "react"
import { DIMENSION_CONFIG } from "@/constants/dimensions"

/** 成长海报组件属性 */
interface GrowthPosterProps {
  child: { name: string; birthday: string; targetSchool?: string | null }
  scores: Record<string, number>
  totalPoints: number
  milestones: Array<{ content: string | null; createdAt: string }>
  onGenerated: (dataUrl: string) => void
}

/** 海报尺寸 */
const POSTER_WIDTH = 750
const POSTER_HEIGHT = 1334

/** 维度键列表（按顺序） */
const DIMENSION_KEYS = ["PHYSICAL", "LIFE", "SOCIAL", "LEARNING"] as const

/**
 * 绘制圆角矩形
 * CanvasRenderingContext2D.roundRect 不是所有环境都支持，手写一个兼容版本
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

/**
 * 根据生日计算年龄文本
 */
function calcAge(birthday: string): string {
  const birth = new Date(birthday)
  const now = new Date()
  let years = now.getFullYear() - birth.getFullYear()
  let months = now.getMonth() - birth.getMonth()
  if (months < 0) {
    years--
    months += 12
  }
  if (years > 0) return `${years}岁${months}个月`
  return `${months}个月`
}

/**
 * 截断文本到指定字数
 */
function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen) + "..."
}

/**
 * 在 Canvas 上绘制成长海报
 */
function drawPoster(
  ctx: CanvasRenderingContext2D,
  child: GrowthPosterProps["child"],
  scores: Record<string, number>,
  totalPoints: number,
  milestones: GrowthPosterProps["milestones"]
) {
  const w = POSTER_WIDTH
  const h = POSTER_HEIGHT

  // ========== 1. 背景渐变 ==========
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h)
  bgGrad.addColorStop(0, "#4CAF50")
  bgGrad.addColorStop(1, "#2E7D32")
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, w, h)

  // ========== 2. 顶部品牌区 ==========
  // 品牌名
  ctx.fillStyle = "#FFFFFF"
  ctx.font = "bold 40px sans-serif"
  ctx.textAlign = "center"
  ctx.fillText("童行", w / 2, 70)

  // Logo 占位圆
  ctx.beginPath()
  ctx.arc(w / 2, 130, 30, 0, Math.PI * 2)
  ctx.fillStyle = "rgba(255,255,255,0.25)"
  ctx.fill()
  ctx.fillStyle = "#FFFFFF"
  ctx.font = "28px sans-serif"
  ctx.fillText("🌱", w / 2, 140)

  // slogan
  ctx.fillStyle = "rgba(255,255,255,0.85)"
  ctx.font = "22px sans-serif"
  ctx.fillText("每一步，都陪你走", w / 2, 190)

  // ========== 3. 孩子信息卡片 ==========
  const cardX = 40
  const cardW = w - 80
  let cardY = 220

  // 白色圆角卡片
  ctx.fillStyle = "#FFFFFF"
  drawRoundedRect(ctx, cardX, cardY, cardW, 120, 16)
  ctx.fill()

  // 阴影效果（通过半透明边框模拟）
  ctx.strokeStyle = "rgba(0,0,0,0.06)"
  ctx.lineWidth = 2
  drawRoundedRect(ctx, cardX, cardY, cardW, 120, 16)
  ctx.stroke()

  // 孩子姓名
  ctx.fillStyle = "#333333"
  ctx.textAlign = "left"
  ctx.font = "bold 30px sans-serif"
  ctx.fillText(child.name, cardX + 30, cardY + 45)

  // 年龄
  ctx.fillStyle = "#666666"
  ctx.font = "22px sans-serif"
  ctx.fillText(calcAge(child.birthday), cardX + 30, cardY + 80)

  // 目标学校
  if (child.targetSchool) {
    ctx.textAlign = "right"
    ctx.fillStyle = "#4CAF50"
    ctx.font = "20px sans-serif"
    ctx.fillText(`目标: ${child.targetSchool}`, cardX + cardW - 30, cardY + 45)
  }

  // ========== 4. 能力雷达图 ==========
  cardY += 150

  // 雷达图背景卡片
  ctx.fillStyle = "#FFFFFF"
  drawRoundedRect(ctx, cardX, cardY, cardW, 380, 16)
  ctx.fill()

  // 标题
  ctx.fillStyle = "#333333"
  ctx.textAlign = "center"
  ctx.font = "bold 24px sans-serif"
  ctx.fillText("能力评估", w / 2, cardY + 38)

  // 雷达图中心和半径
  const radarCx = w / 2
  const radarCy = cardY + 220
  const radarR = 130

  // 绘制网格（4层）
  for (let layer = 1; layer <= 4; layer++) {
    const layerR = (radarR * layer) / 4
    ctx.beginPath()
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI * 2 * i) / 4 - Math.PI / 2
      const x = radarCx + layerR * Math.cos(angle)
      const y = radarCy + layerR * Math.sin(angle)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.strokeStyle = "rgba(0,0,0,0.08)"
    ctx.lineWidth = 1
    ctx.stroke()
  }

  // 绘制轴线
  for (let i = 0; i < 4; i++) {
    const angle = (Math.PI * 2 * i) / 4 - Math.PI / 2
    ctx.beginPath()
    ctx.moveTo(radarCx, radarCy)
    ctx.lineTo(
      radarCx + radarR * Math.cos(angle),
      radarCy + radarR * Math.sin(angle)
    )
    ctx.strokeStyle = "rgba(0,0,0,0.1)"
    ctx.lineWidth = 1
    ctx.stroke()
  }

  // 绘制数据区域
  ctx.beginPath()
  DIMENSION_KEYS.forEach((key, i) => {
    const angle = (Math.PI * 2 * i) / 4 - Math.PI / 2
    const score = scores[key] ?? 0
    const r = (radarR * score) / 100
    const x = radarCx + r * Math.cos(angle)
    const y = radarCy + r * Math.sin(angle)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.closePath()
  ctx.fillStyle = "rgba(76, 175, 80, 0.25)"
  ctx.fill()
  ctx.strokeStyle = "#4CAF50"
  ctx.lineWidth = 3
  ctx.stroke()

  // 绘制数据点
  DIMENSION_KEYS.forEach((key, i) => {
    const angle = (Math.PI * 2 * i) / 4 - Math.PI / 2
    const score = scores[key] ?? 0
    const r = (radarR * score) / 100
    const x = radarCx + r * Math.cos(angle)
    const y = radarCy + r * Math.sin(angle)
    ctx.beginPath()
    ctx.arc(x, y, 6, 0, Math.PI * 2)
    ctx.fillStyle = "#4CAF50"
    ctx.fill()
    ctx.strokeStyle = "#FFFFFF"
    ctx.lineWidth = 2
    ctx.stroke()
  })

  // 绘制维度标签
  const labelR = radarR + 30
  DIMENSION_KEYS.forEach((key, i) => {
    const config = DIMENSION_CONFIG[key]
    const angle = (Math.PI * 2 * i) / 4 - Math.PI / 2
    const x = radarCx + labelR * Math.cos(angle)
    const y = radarCy + labelR * Math.sin(angle)

    // 标签背景
    ctx.fillStyle = config.color
    drawRoundedRect(ctx, x - 42, y - 14, 84, 28, 14)
    ctx.fill()

    // 标签文字
    ctx.fillStyle = "#FFFFFF"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.font = "bold 16px sans-serif"
    ctx.fillText(config.label, x, y)
    ctx.textBaseline = "alphabetic"

    // 分数
    ctx.fillStyle = config.color
    ctx.font = "bold 20px sans-serif"
    ctx.fillText(String(scores[key] ?? 0), x, y + 28)
  })

  // ========== 5. 积分展示 ==========
  cardY += 410

  // 积分卡片
  ctx.fillStyle = "#FFFFFF"
  drawRoundedRect(ctx, cardX, cardY, cardW, 110, 16)
  ctx.fill()

  // 积分数字
  ctx.fillStyle = "#FF9800"
  ctx.textAlign = "center"
  ctx.font = "bold 56px sans-serif"
  ctx.fillText(String(totalPoints), w / 2, cardY + 65)

  // 积分标签
  ctx.fillStyle = "#666666"
  ctx.font = "20px sans-serif"
  ctx.fillText("成长积分", w / 2, cardY + 95)

  // ========== 6. 里程碑亮点 ==========
  cardY += 135

  // 里程碑卡片
  ctx.fillStyle = "#FFFFFF"
  const milestonesToShow = milestones.slice(0, 3)
  const milestoneCardH = 50 + milestonesToShow.length * 45
  drawRoundedRect(ctx, cardX, cardY, cardW, milestoneCardH, 16)
  ctx.fill()

  // 标题
  ctx.fillStyle = "#333333"
  ctx.textAlign = "left"
  ctx.font = "bold 22px sans-serif"
  ctx.fillText("🌟 里程碑亮点", cardX + 25, cardY + 35)

  // 里程碑列表
  milestonesToShow.forEach((m, i) => {
    const text = truncateText(m.content ?? "记录了一个里程碑", 20)
    const my = cardY + 70 + i * 45

    // 序号圆点
    ctx.beginPath()
    ctx.arc(cardX + 38, my, 10, 0, Math.PI * 2)
    ctx.fillStyle = "#4CAF50"
    ctx.fill()
    ctx.fillStyle = "#FFFFFF"
    ctx.textAlign = "center"
    ctx.font = "bold 14px sans-serif"
    ctx.fillText(String(i + 1), cardX + 38, my + 5)

    // 内容文字
    ctx.fillStyle = "#333333"
    ctx.textAlign = "left"
    ctx.font = "20px sans-serif"
    ctx.fillText(text, cardX + 58, my + 7)
  })

  // ========== 7. 底部品牌区 ==========
  const footerY = h - 100

  // 二维码占位
  const qrSize = 60
  const qrX = w / 2 - 100
  const qrY = footerY

  ctx.fillStyle = "rgba(255,255,255,0.2)"
  drawRoundedRect(ctx, qrX, qrY, qrSize, qrSize, 8)
  ctx.fill()
  ctx.strokeStyle = "rgba(255,255,255,0.4)"
  ctx.lineWidth = 2
  drawRoundedRect(ctx, qrX, qrY, qrSize, qrSize, 8)
  ctx.stroke()
  ctx.fillStyle = "rgba(255,255,255,0.6)"
  ctx.textAlign = "center"
  ctx.font = "14px sans-serif"
  ctx.fillText("二维码", qrX + qrSize / 2, qrY + qrSize / 2 + 5)

  // 扫码文字
  ctx.fillStyle = "rgba(255,255,255,0.8)"
  ctx.textAlign = "left"
  ctx.font = "18px sans-serif"
  ctx.fillText("扫码了解更多", qrX + qrSize + 15, qrY + 35)

  // 版权
  ctx.fillStyle = "rgba(255,255,255,0.5)"
  ctx.textAlign = "center"
  ctx.font = "14px sans-serif"
  ctx.fillText("© 童行 KidStep · 科学衔接，快乐成长", w / 2, h - 25)
}

/**
 * 成长海报组件
 * 使用 Canvas API 绘制海报，绘制完成后通过 onGenerated 回调返回图片 DataURL
 */
export default function GrowthPoster({
  child,
  scores,
  totalPoints,
  milestones,
  onGenerated,
}: GrowthPosterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // 设置 canvas 尺寸（考虑高清屏，使用 2 倍像素）
    const dpr = 2
    canvas.width = POSTER_WIDTH * dpr
    canvas.height = POSTER_HEIGHT * dpr
    ctx.scale(dpr, dpr)

    // 绘制海报
    drawPoster(ctx, child, scores, totalPoints, milestones)

    // 导出图片
    const dataUrl = canvas.toDataURL("image/png")
    onGenerated(dataUrl)
  }, [child, scores, totalPoints, milestones, onGenerated])

  return (
    <canvas
      ref={canvasRef}
      style={{ display: "none" }}
      width={POSTER_WIDTH}
      height={POSTER_HEIGHT}
    />
  )
}
