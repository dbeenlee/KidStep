import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { QUESTIONS } from "@/constants/questions"
import { calculateScore, generateReport } from "@/lib/scoring"

/** GET /api/assessments?childId=x - 评估历史 */
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

  if (!childId) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "缺少 childId" } },
      { status: 400 }
    )
  }

  const assessments = await db.assessment.findMany({
    where: { childId },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ success: true, data: assessments })
}

/** POST /api/assessments - 提交评估 */
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "请先登录" } },
      { status: 401 }
    )
  }

  const body = await request.json()
  const { childId, dimension, answers } = body

  if (!childId || !dimension || !answers) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "参数不完整" } },
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

  // 计算分数和报告
  const score = calculateScore(answers)
  const dimensionQuestions = QUESTIONS.filter(q => q.dimension === dimension)
  const report = generateReport(answers, dimensionQuestions)

  // 保存评估记录
  const assessment = await db.assessment.create({
    data: {
      childId,
      dimension,
      score,
      answers: JSON.stringify(answers),
      report: JSON.stringify(report),
    },
  })

  // 给积分
  await db.point.create({
    data: {
      childId,
      amount: 5,
      reason: "完成能力评估",
      source: "ASSESSMENT",
    },
  })

  return NextResponse.json({ success: true, data: assessment })
}
