import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

interface RouteParams {
  params: Promise<{ id: string }>
}

/** GET /api/assessments/[id] - 获取单个评估详情 */
export async function GET(_request: Request, { params }: RouteParams) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "请先登录" } },
      { status: 401 }
    )
  }

  const { id } = await params

  const assessment = await db.assessment.findUnique({
    where: { id },
    include: {
      child: {
        select: { userId: true },
      },
    },
  })

  if (!assessment) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "评估记录不存在" } },
      { status: 404 }
    )
  }

  // 验证评估属于当前用户的孩子
  if (assessment.child.userId !== session.user.id) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "无权访问" } },
      { status: 403 }
    )
  }

  // 解析 JSON 字段
  const data = {
    id: assessment.id,
    childId: assessment.childId,
    dimension: assessment.dimension,
    score: assessment.score,
    answers: JSON.parse(assessment.answers),
    report: assessment.report ? JSON.parse(assessment.report) : null,
    createdAt: assessment.createdAt.toISOString(),
  }

  return NextResponse.json({ success: true, data })
}
