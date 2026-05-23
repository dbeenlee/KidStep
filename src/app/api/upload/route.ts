import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { validateFile, generateFileName } from "@/lib/upload"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

/** POST /api/upload - 上传图片文件 */
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "请先登录" } },
      { status: 401 }
    )
  }

  const formData = await request.formData()
  const file = formData.get("file") as File | null

  if (!file) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "缺少文件" } },
      { status: 400 }
    )
  }

  // 验证文件
  const validation = validateFile(file)
  if (!validation.valid) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: validation.error } },
      { status: 400 }
    )
  }

  // 生成文件名并保存
  const fileName = generateFileName(file.name)
  const uploadDir = path.join(process.cwd(), "public", "uploads", "milestones")
  const filePath = path.join(uploadDir, fileName)

  // 确保目录存在
  await mkdir(uploadDir, { recursive: true })

  // 将文件写入磁盘
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(filePath, buffer)

  const url = `/uploads/milestones/${fileName}`

  return NextResponse.json({ success: true, data: { url } })
}
