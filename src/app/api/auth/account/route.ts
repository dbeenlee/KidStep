import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

/** GET /api/auth/account — 获取当前用户的账号绑定状态 */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "请先登录" } },
      { status: 401 }
    )
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      phone: true,
      email: true,
      passwordHash: true,
      wechatOpenid: true,
      nickname: true,
      avatar: true,
    },
  })

  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "用户不存在" } },
      { status: 404 }
    )
  }

  return NextResponse.json({
    success: true,
    data: {
      id: user.id,
      phone: user.phone,
      email: user.email,
      hasWechat: !!user.wechatOpenid,
      hasPassword: !!user.passwordHash,
      nickname: user.nickname,
      avatar: user.avatar,
    },
  })
}
