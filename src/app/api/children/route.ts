import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

/** GET /api/children - 获取当前用户的孩子列表 */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "请先登录" } },
      { status: 401 }
    )
  }

  const children = await db.child.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json({ success: true, data: children })
}

/** POST /api/children - 添加孩子 */
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "请先登录" } },
      { status: 401 }
    )
  }

  const body = await request.json()
  const { name, birthday, gender, targetSchool } = body

  if (!name || !birthday) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "姓名和生日必填" } },
      { status: 400 }
    )
  }

  const child = await db.child.create({
    data: {
      userId: session.user.id,
      name,
      birthday: new Date(birthday),
      gender: gender ?? "UNKNOWN",
      targetSchool,
    },
  })

  return NextResponse.json({ success: true, data: child })
}
