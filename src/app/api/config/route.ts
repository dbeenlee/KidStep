import { NextResponse } from "next/server"

/** GET /api/config — 返回公开的功能开关（无需认证） */
export async function GET() {
  return NextResponse.json({
    smsEnabled: !!(
      process.env.ALIYUN_SMS_ACCESS_KEY_ID &&
      process.env.ALIYUN_SMS_ACCESS_KEY_SECRET &&
      process.env.ALIYUN_SMS_TEMPLATE_CODE
    ),
    wechatEnabled: !!(
      process.env.WECHAT_OPEN_APPID &&
      process.env.WECHAT_OPEN_APPSECRET
    ),
  })
}
