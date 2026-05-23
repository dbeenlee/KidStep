import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { db } from "@/lib/db"

/** POST /api/auth/register - 邮箱注册 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, nickname } = body as {
      email?: string
      password?: string
      nickname?: string
    }

    // 参数校验
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "邮箱和密码不能为空" } },
        { status: 400 }
      )
    }

    // 邮箱格式校验
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "邮箱格式不正确" } },
        { status: 400 }
      )
    }

    // 密码强度校验
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "密码至少需要6位" } },
        { status: 400 }
      )
    }

    // 检查邮箱是否已注册
    const existing = await db.user.findUnique({
      where: { email },
    })
    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: "CONFLICT", message: "该邮箱已注册" } },
        { status: 409 }
      )
    }

    // 哈希密码
    const passwordHash = await hash(password, 10)

    // 创建用户
    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        nickname: nickname ?? email.split("@")[0],
      },
    })

    return NextResponse.json({
      success: true,
      data: { id: user.id, email: user.email, nickname: user.nickname },
    })
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "注册失败，请稍后重试" } },
      { status: 500 }
    )
  }
}
