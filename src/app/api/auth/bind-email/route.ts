import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

/** POST /api/auth/bind-email — 微信用户绑定邮箱+密码 */
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "请先登录" } },
      { status: 401 }
    )
  }

  const body = await request.json()
  const { email, password } = body as { email?: string; password?: string }

  if (!email || !password) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "邮箱和密码不能为空" } },
      { status: 400 }
    )
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "邮箱格式不正确" } },
      { status: 400 }
    )
  }

  if (password.length < 6) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "密码至少需要6位" } },
      { status: 400 }
    )
  }

  // 检查邮箱是否已被其他用户使用
  const existing = await db.user.findUnique({ where: { email } })
  if (existing && existing.id !== session.user.id) {
    return NextResponse.json(
      { success: false, error: { code: "CONFLICT", message: "该邮箱已被其他账号绑定" } },
      { status: 409 }
    )
  }

  const passwordHash = await hash(password, 10)

  await db.user.update({
    where: { id: session.user.id },
    data: { email, passwordHash },
  })

  return NextResponse.json({ success: true })
}
