import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

const VALID_SOURCES = ["CHECKIN", "TASK_COMPLETE", "ASSESSMENT", "MILESTONE", "STREAK"] as const

/** GET /api/points/history?childId=xxx&page=1&pageSize=20&source=CHECKIN */
export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "请先登录" } },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  const childId = searchParams.get("childId")
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1") || 1)
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20") || 20))
  const source = searchParams.get("source")

  if (!childId) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "缺少 childId" } },
      { status: 400 }
    )
  }

  // 验证孩子属于当前用户
  const child = await db.child.findFirst({
    where: { id: childId, userId: session.user.id },
  })
  if (!child) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "孩子不存在" } },
      { status: 404 }
    )
  }

  // 构建查询条件
  const where: { childId: string; source?: string } = { childId }
  if (source && VALID_SOURCES.includes(source as (typeof VALID_SOURCES)[number])) {
    where.source = source
  }

  const [items, total] = await Promise.all([
    db.point.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        amount: true,
        reason: true,
        source: true,
        createdAt: true,
      },
    }),
    db.point.count({ where }),
  ])

  return NextResponse.json({
    success: true,
    data: {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  })
}
