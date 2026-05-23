import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { db } from "@/lib/db"

/** 是否为开发环境 */
const isDev = process.env.NODE_ENV === "development"

/** POST /api/auth/reset-password — 重置密码 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, code, newPassword } = body as {
      email?: string
      code?: string
      newPassword?: string
    }

    // 参数校验
    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "邮箱、验证码和新密码不能为空" } },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "密码至少需要6位" } },
        { status: 400 }
      )
    }

    // 验证码校验
    if (!isDev) {
      const emailCode = await db.emailCode.findFirst({
        where: {
          email,
          code,
          used: false,
          expiresAt: { gt: new Date() },
        },
      })

      if (!emailCode) {
        return NextResponse.json(
          { success: false, error: { code: "INVALID_CODE", message: "验证码错误或已过期" } },
          { status: 400 }
        )
      }

      // 标记验证码已使用
      await db.emailCode.update({
        where: { id: emailCode.id },
        data: { used: true },
      })
    } else {
      // 开发模式：任意 6 位数字即可
      if (!/^\d{6}$/.test(code)) {
        return NextResponse.json(
          { success: false, error: { code: "INVALID_CODE", message: "请输入6位数字验证码" } },
          { status: 400 }
        )
      }
    }

    // 查找用户
    const user = await db.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "该邮箱未注册" } },
        { status: 404 }
      )
    }

    // 哈希新密码并更新
    const passwordHash = await hash(newPassword, 10)
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "重置失败，请稍后重试" } },
      { status: 500 }
    )
  }
}
