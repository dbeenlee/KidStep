import { NextResponse } from "next/server"
import { compare, hash } from "bcryptjs"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

/** POST /api/auth/change-password — 修改密码（需登录） */
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "请先登录" } },
      { status: 401 }
    )
  }

  const body = await request.json()
  const { oldPassword, newPassword } = body as {
    oldPassword?: string
    newPassword?: string
  }

  if (!oldPassword || !newPassword) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "请输入原密码和新密码" } },
      { status: 400 }
    )
  }

  if (newPassword.length < 6) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "新密码至少需要6位" } },
      { status: 400 }
    )
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, passwordHash: true },
  })

  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "用户不存在" } },
      { status: 404 }
    )
  }

  if (!user.passwordHash) {
    return NextResponse.json(
      { success: false, error: { code: "NO_PASSWORD", message: "请先绑定邮箱并设置密码" } },
      { status: 400 }
    )
  }

  // 验证原密码
  const isValid = await compare(oldPassword, user.passwordHash)
  if (!isValid) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_PASSWORD", message: "原密码错误" } },
      { status: 400 }
    )
  }

  // 更新密码
  const passwordHash = await hash(newPassword, 10)
  await db.user.update({
    where: { id: user.id },
    data: { passwordHash },
  })

  return NextResponse.json({ success: true })
}
