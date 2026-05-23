import { NextResponse } from "next/server"

/**
 * POST /api/analytics
 * 接收埋点事件数据
 *
 * 设计原则：
 * 1. 轻量快速，不阻塞响应
 * 2. 使用 console.log 输出，可被日志服务采集
 * 3. 生产环境可替换为数据库存储
 */

interface AnalyticsEvent {
  name: string
  properties: Record<string, unknown>
}

export async function POST(request: Request) {
  try {
    // sendBeacon 发送的是 Blob，需要特殊处理
    const contentType = request.headers.get("content-type") ?? ""
    let event: AnalyticsEvent

    if (contentType.includes("application/json")) {
      event = await request.json()
    } else {
      // sendBeacon 发送的 Blob
      const text = await request.text()
      event = JSON.parse(text)
    }

    // 验证事件格式
    if (!event.name || typeof event.name !== "string") {
      return new NextResponse(null, { status: 204 })
    }

    // 输出到控制台（可被日志服务采集）
    const logEntry = {
      type: "analytics",
      event: event.name,
      properties: event.properties,
      timestamp: new Date().toISOString(),
      ip: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown",
    }

    console.log("[Analytics]", JSON.stringify(logEntry))

    // 返回 204 No Content（成功但无响应体）
    return new NextResponse(null, { status: 204 })
  } catch {
    // 解析失败静默处理
    return new NextResponse(null, { status: 204 })
  }
}
