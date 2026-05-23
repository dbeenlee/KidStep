import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/upload", () => ({
  validateFile: vi.fn(),
  generateFileName: vi.fn(),
}))

vi.mock("node:fs/promises", () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
}))

import { auth } from "@/lib/auth"
import { validateFile, generateFileName } from "@/lib/upload"
import { POST } from "@/app/api/upload/route"

const mockSession = { user: { id: "user-1" } }

function createMockFile(
  name = "test.jpg",
  type = "image/jpeg",
  size = 1024,
): File {
  const buffer = new ArrayBuffer(size)
  return new File([buffer], name, { type })
}

/** 创建上传请求（mock formData 绕过 Node.js File webidl 限制） */
function createUploadRequest(file: File | null) {
  const entries = new Map<string, FormDataEntryValue>()
  if (file) {
    entries.set("file", file as unknown as FormDataEntryValue)
  }
  const mockFormData = {
    get: (key: string) => entries.get(key) ?? null,
  } as FormData
  return {
    formData: async () => mockFormData,
  } as unknown as Request
}

describe("POST /api/upload", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("未授权返回 401", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(null)
    const formData = new FormData()
    const req = new Request("http://localhost:3000/api/upload", {
      method: "POST",
      body: formData,
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it("无文件返回 400", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    const req = createUploadRequest(null)
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error.code).toBe("VALIDATION_ERROR")
    expect(data.error.message).toBe("缺少文件")
  })

  it("文件校验失败返回 400", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    vi.mocked(validateFile).mockReturnValue({
      valid: false,
      error: "仅支持 JPG、PNG、WebP 格式的图片",
    })

    const req = createUploadRequest(createMockFile("test.gif", "image/gif"))
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error.code).toBe("VALIDATION_ERROR")
    expect(data.error.message).toBe("仅支持 JPG、PNG、WebP 格式的图片")
  })

  it("成功上传返回 URL", async () => {
    vi.mocked(auth as () => Promise<unknown>).mockResolvedValue(mockSession)
    vi.mocked(validateFile).mockReturnValue({ valid: true })
    vi.mocked(generateFileName).mockReturnValue("1685000000000-abc123.jpg")

    const req = createUploadRequest(createMockFile("photo.jpg", "image/jpeg", 2048))
    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.url).toBe("/uploads/milestones/1685000000000-abc123.jpg")

    expect(generateFileName).toHaveBeenCalledWith("photo.jpg")
  })
})
