import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

/** PUT /api/children/[id] - 编辑孩子信息 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "请先登录" } },
      { status: 401 }
    )
  }

  // 验证孩子属于当前用户
  const existing = await db.child.findFirst({
    where: { id: params.id, userId: session.user.id },
  })
  if (!existing) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "孩子不存在" } },
      { status: 404 }
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

  const child = await db.child.update({
    where: { id: params.id },
    data: {
      name,
      birthday: new Date(birthday),
      gender: gender ?? "UNKNOWN",
      targetSchool: targetSchool || null,
    },
  })

  return NextResponse.json({ success: true, data: child })
}

/** DELETE /api/children/[id] - 删除孩子 */
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "请先登录" } },
      { status: 401 }
    )
  }

  // 验证孩子属于当前用户
  const existing = await db.child.findFirst({
    where: { id: params.id, userId: session.user.id },
  })
  if (!existing) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "孩子不存在" } },
      { status: 404 }
    )
  }

  // 级联删除会自动清理关联数据（Prisma onDelete: Cascade）
  await db.child.delete({
    where: { id: params.id },
  })

  return NextResponse.json({ success: true })
}
