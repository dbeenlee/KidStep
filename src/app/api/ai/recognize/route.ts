import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { validateFile } from "@/lib/upload"
import { recognizeImage } from "@/lib/ai"

/** 分析结果类型 */
interface AnalysisResult {
  analysis: string
  suggestions: string[]
}

/** 从 AI 回复中提取建议列表 */
function extractSuggestions(text: string): string[] {
  // 按行拆分，提取以数字、破折号或星号开头的建议行
  const lines = text.split("\n")
  const suggestions: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    // 匹配 "1." "1)" "- " "* " 开头的行
    if (/^(\d+[\.\)]\s*|[-*]\s+)/.test(trimmed)) {
      const content = trimmed.replace(/^(\d+[\.\)]\s*|[-*]\s+)/, "").trim()
      if (content) suggestions.push(content)
    }
  }

  // 如果没有匹配到结构化建议，返回空数组
  return suggestions.slice(0, 5) // 最多保留 5 条
}

/** POST /api/ai/recognize - 图像识别（作业/作品分析） */
export async function POST(request: Request) {
  // 1. 认证
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "请先登录" } },
      { status: 401 }
    )
  }

  try {
    // 2. 获取文件
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "缺少文件" } },
        { status: 400 }
      )
    }

    // 3. 校验文件
    const validation = validateFile(file)
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: validation.error } },
        { status: 400 }
      )
    }

    // 4. 文件转 base64
    const arrayBuffer = await file.arrayBuffer()
    const imageBase64 = Buffer.from(arrayBuffer).toString("base64")

    // 5. 调用 AI 识别
    const prompt =
      "请分析这张孩子作业/作品图片。请从以下角度分析：1) 完成质量 2) 书写/绘画水平 3) 值得表扬的地方 4) 可以改进的建议。请用温和鼓励的语气，适合家长阅读。"
    const analysis = await recognizeImage(imageBase64, prompt)

    // 6. 从回复中提取建议
    const suggestions = extractSuggestions(analysis)

    const data: AnalysisResult = { analysis, suggestions }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : "识别失败，请稍后重试"
    return NextResponse.json(
      { success: false, error: { code: "AI_ERROR", message } },
      { status: 500 }
    )
  }
}
