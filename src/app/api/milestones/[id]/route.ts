import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

/** DELETE /api/milestones/[id] - 删除里程碑 */
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

  // 验证里程碑存在且属于当前用户的孩子
  const milestone = await db.milestone.findFirst({
    where: { id: params.id },
    include: { child: true },
  })

  if (!milestone) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "记录不存在" } },
      { status: 404 }
    )
  }

  if (milestone.child.userId !== session.user.id) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "无权操作" } },
      { status: 403 }
    )
  }

  await db.milestone.delete({
    where: { id: params.id },
  })

  return NextResponse.json({ success: true })
}
