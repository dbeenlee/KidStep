import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

/** 生成6位随机邀请码（大写字母+数字） */
function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/** POST /api/invitations - 创建邀请 */
export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "请先登录" } },
      { status: 401 }
    )
  }

  // 生成唯一邀请码（重试3次避免冲突）
  let code = generateInviteCode()
  for (let attempt = 0; attempt < 3; attempt++) {
    const existing = await db.invitation.findUnique({ where: { code } })
    if (!existing) break
    code = generateInviteCode()
  }

  const invitation = await db.invitation.create({
    data: {
      userId: session.user.id,
      code,
      role: "viewer",
      status: "pending",
    },
  })

  return NextResponse.json({
    success: true,
    data: { id: invitation.id, code: invitation.code },
  })
}

/** GET /api/invitations - 获取我发出的邀请列表 */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "请先登录" } },
      { status: 401 }
    )
  }

  const invitations = await db.invitation.findMany({
    where: { userId: session.user.id },
    include: {
      target: {
        select: { id: true, nickname: true, phone: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ success: true, data: invitations })
}
