import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { generateEmailCode, sendVerificationEmail } from "@/lib/email"

/** 邮箱格式校验 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** POST /api/auth/send-email-code — 发送邮箱验证码 */
export async function POST(request: Request) {
  const body = await request.json()
  const email = (body.email as string)?.trim()
  const type = body.type as string

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_EMAIL", message: "请输入正确的邮箱" } },
      { status: 400 }
    )
  }

  if (type !== "register" && type !== "reset") {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_TYPE", message: "参数错误" } },
      { status: 400 }
    )
  }

  // 找回密码：检查用户是否存在
  if (type === "reset") {
    const user = await db.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "该邮箱未注册" } },
        { status: 404 }
      )
    }
  }

  // 频率限制：60 秒内不能重复发送
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000)
  const recentCode = await db.emailCode.findFirst({
    where: {
      email,
      createdAt: { gt: oneMinuteAgo },
    },
  })

  if (recentCode) {
    return NextResponse.json(
      { success: false, error: { code: "RATE_LIMITED", message: "请60秒后再试" } },
      { status: 429 }
    )
  }

  // 生成并存储验证码
  const code = generateEmailCode()
  await db.emailCode.create({
    data: {
      email,
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 分钟
    },
  })

  // 发送邮件
  await sendVerificationEmail(email, code, type as "register" | "reset")

  return NextResponse.json({ success: true })
}
