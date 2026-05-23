import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { transcribeAudio } from "@/lib/ai"

/** 允许的音频 MIME 类型 */
const ALLOWED_TYPES = ["audio/webm", "audio/mp3", "audio/wav"]

/** 最大文件大小：10MB */
const MAX_FILE_SIZE = 10 * 1024 * 1024

/** POST /api/ai/transcribe - 语音转文字 */
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "请先登录" } },
      { status: 401 }
    )
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_REQUEST", message: "请求格式错误" } },
      { status: 400 }
    )
  }

  const file = formData.get("file") as File | null
  if (!file) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "缺少音频文件" } },
      { status: 400 }
    )
  }

  // 校验文件类型
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_TYPE", message: "不支持的音频格式，请上传 webm、mp3 或 wav 文件" } },
      { status: 400 }
    )
  }

  // 校验文件大小
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { success: false, error: { code: "FILE_TOO_LARGE", message: "文件大小不能超过 10MB" } },
      { status: 400 }
    )
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const text = await transcribeAudio(buffer, file.name)

    return NextResponse.json({ success: true, data: { text } })
  } catch (err) {
    console.error("语音转写失败:", err)
    return NextResponse.json(
      { success: false, error: { code: "TRANSCRIBE_FAILED", message: "语音转写失败，请稍后重试" } },
      { status: 500 }
    )
  }
}
