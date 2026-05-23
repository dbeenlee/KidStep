import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

interface RouteParams {
  params: Promise<{ code: string }>
}

/** POST /api/invitations/[code] - 接受邀请 */
export async function POST(_request: Request, { params }: RouteParams) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "请先登录" } },
      { status: 401 }
    )
  }

  const { code } = await params

  // 查找邀请
  const invitation = await db.invitation.findUnique({
    where: { code },
    include: {
      target: { select: { id: true, nickname: true, phone: true } },
    },
  })

  if (!invitation) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "邀请码无效" } },
      { status: 404 }
    )
  }

  // 不能接受自己发的邀请
  if (invitation.userId === session.user.id) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "不能接受自己发出的邀请" } },
      { status: 403 }
    )
  }

  // 状态校验
  if (invitation.status !== "pending") {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_STATUS", message: "该邀请已被使用或已过期" } },
      { status: 400 }
    )
  }

  // 接受邀请
  const updated = await db.invitation.update({
    where: { id: invitation.id },
    data: {
      targetId: session.user.id,
      status: "accepted",
    },
    include: {
      target: { select: { id: true, nickname: true, phone: true } },
    },
  })

  return NextResponse.json({ success: true, data: updated })
}

/** DELETE /api/invitations/[code] - 删除自己发出的邀请 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "请先登录" } },
      { status: 401 }
    )
  }

  const { code } = await params

  // 支持通过邀请码或记录ID查找
  const invitation = await db.invitation.findFirst({
    where: {
      OR: [{ code }, { id: code }],
      userId: session.user.id,
    },
  })

  if (!invitation) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "邀请记录不存在" } },
      { status: 404 }
    )
  }

  await db.invitation.delete({ where: { id: invitation.id } })

  return NextResponse.json({ success: true, data: { id: invitation.id } })
}
