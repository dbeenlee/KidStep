import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { validateFile, generateFileName } from "../upload"

describe("upload", () => {
  describe("validateFile", () => {
    it("合法 JPG 文件应通过验证", () => {
      const file = new File(["test"], "photo.jpg", { type: "image/jpeg" })
      // 设置 size（jsdom 中 File 构造函数的 size 自动计算）
      Object.defineProperty(file, "size", { value: 1024 })
      expect(validateFile(file)).toEqual({ valid: true })
    })

    it("合法 PNG 文件应通过验证", () => {
      const file = new File(["test"], "photo.png", { type: "image/png" })
      Object.defineProperty(file, "size", { value: 1024 })
      expect(validateFile(file)).toEqual({ valid: true })
    })

    it("合法 WebP 文件应通过验证", () => {
      const file = new File(["test"], "photo.webp", { type: "image/webp" })
      Object.defineProperty(file, "size", { value: 1024 })
      expect(validateFile(file)).toEqual({ valid: true })
    })

    it("不支持的文件类型应返回错误", () => {
      const file = new File(["test"], "doc.pdf", { type: "application/pdf" })
      const result = validateFile(file)
      expect(result.valid).toBe(false)
      expect(result.error).toBe("仅支持 JPG、PNG、WebP 格式的图片")
    })

    it("超过 5MB 的文件应返回错误", () => {
      const file = new File(["test"], "large.jpg", { type: "image/jpeg" })
      Object.defineProperty(file, "size", { value: 6 * 1024 * 1024 }) // 6MB
      const result = validateFile(file)
      expect(result.valid).toBe(false)
      expect(result.error).toBe("图片大小不能超过 5MB")
    })

    it("恰好 5MB 的文件应通过验证", () => {
      const file = new File(["test"], "exact.jpg", { type: "image/jpeg" })
      Object.defineProperty(file, "size", { value: 5 * 1024 * 1024 }) // 5MB
      expect(validateFile(file)).toEqual({ valid: true })
    })

    it("GIF 文件应被拒绝", () => {
      const file = new File(["test"], "animation.gif", { type: "image/gif" })
      const result = validateFile(file)
      expect(result.valid).toBe(false)
    })
  })

  describe("generateFileName", () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2026, 4, 23, 10, 30, 0))
      vi.spyOn(Math, "random").mockReturnValue(0.123456789)
    })

    afterEach(() => {
      vi.useRealTimers()
      vi.restoreAllMocks()
    })

    it("应返回包含时间戳和随机串的文件名", () => {
      const result = generateFileName("photo.jpg")
      // 格式: {timestamp}-{random}.{ext}
      expect(result).toMatch(/^\d{13}-[a-z0-9]{6}\.jpg$/)
    })

    it("应保留原始文件扩展名", () => {
      expect(generateFileName("image.png")).toMatch(/\.png$/)
      expect(generateFileName("image.webp")).toMatch(/\.webp$/)
    })

    it("无扩展名时应默认使用 jpg", () => {
      const result = generateFileName("noext")
      expect(result).toMatch(/\.jpg$/)
    })

    it("连续调用应生成不同文件名（时间戳+随机）", () => {
      const name1 = generateFileName("a.jpg")
      // 推进时间
      vi.setSystemTime(new Date(2026, 4, 23, 10, 30, 1))
      const name2 = generateFileName("a.jpg")
      expect(name1).not.toBe(name2)
    })
  })
})
