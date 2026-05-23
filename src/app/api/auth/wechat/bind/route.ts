import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

const WECHAT_APPID = process.env.WECHAT_OPEN_APPID ?? ""

/** GET /api/auth/wechat/bind — 已登录用户跳转微信授权绑定 */
export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", request.url).toString())
  }

  if (!WECHAT_APPID) {
    return NextResponse.redirect(new URL("/profile/settings?error=wechat_not_configured", request.url).toString())
  }

  const { origin } = new URL(request.url)
  const redirectUri = `${origin}/api/auth/wechat/callback?bind=1`
  const state = crypto.randomUUID()

  const finalUrl = `https://open.weixin.qq.com/connect/qrconnect?appid=${WECHAT_APPID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=snsapi_login&state=${state}#wechat_redirect`

  return NextResponse.redirect(finalUrl)
}
