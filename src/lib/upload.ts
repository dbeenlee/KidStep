// 允许的图片 MIME 类型
const allowedTypes = ["image/jpeg", "image/png", "image/webp"]

// 最大文件大小 5MB
const maxSize = 5 * 1024 * 1024

/** 验证文件类型和大小 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: "仅支持 JPG、PNG、WebP 格式的图片" }
  }

  if (file.size > maxSize) {
    return { valid: false, error: "图片大小不能超过 5MB" }
  }

  return { valid: true }
}

/** 生成唯一文件名，返回带扩展名的文件名 */
export function generateFileName(originalName: string): string {
  const parts = originalName.split(".")
  const ext = parts.length > 1 ? parts.pop()! : "jpg"
  const timestamp = Date.now()
  const random = Math.random().toString(36).slice(2, 8)
  return `${timestamp}-${random}.${ext}`
}
