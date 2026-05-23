import nodemailer from "nodemailer"

/** 是否为开发环境 */
const isDev = process.env.NODE_ENV === "development"

/** 是否配置了 SMTP */
const hasSmtp = !!(
  process.env.SMTP_HOST &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
)

/** 生成 6 位随机数字验证码 */
export function generateEmailCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

/** 发送验证码邮件 */
export async function sendVerificationEmail(
  to: string,
  code: string,
  type: "register" | "reset"
): Promise<void> {
  const subject =
    type === "register" ? "童行 - 注册验证码" : "童行 - 密码重置验证码"

  const html = `
    <div style="max-width:400px;margin:0 auto;padding:24px;font-family:sans-serif;">
      <h2 style="color:#4CAF50;text-align:center;">童行</h2>
      <p style="color:#333;font-size:16px;">您的验证码是：</p>
      <div style="background:#f5f5f5;padding:16px;text-align:center;border-radius:8px;margin:16px 0;">
        <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#4CAF50;">${code}</span>
      </div>
      <p style="color:#999;font-size:14px;">验证码 10 分钟内有效，请勿泄露给他人。</p>
    </div>
  `

  // 开发模式：只输出到控制台
  if (isDev || !hasSmtp) {
    console.log(`[Email Dev] ${subject} → ${to}: ${code}`)
    return
  }

  // 生产模式：通过 SMTP 发送
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  await transporter.sendMail({
    from: process.env.SMTP_FROM || `童行 <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  })
}
