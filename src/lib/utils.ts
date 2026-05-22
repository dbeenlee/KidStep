import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]
}

/**
 * 获取今天的日期字符串
 */
export function today(): string {
  return formatDate(new Date())
}

/**
 * 计算年龄（岁）
 */
export function calculateAge(birthday: Date): number {
  const now = new Date()
  const birth = new Date(birthday)
  let age = now.getFullYear() - birth.getFullYear()
  const monthDiff = now.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--
  }
  return age
}

/**
 * 等待指定毫秒
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 从数组中随机取一个元素
 */
export function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
