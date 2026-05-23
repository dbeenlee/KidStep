import { NextResponse } from "next/server"
import { db } from "@/lib/db"

const WECHAT_APPID = process.env.WECHAT_OPEN_APPID ?? ""
const WECHAT_SECRET = process.env.WECHAT_OPEN_APPSECRET ?? ""

/**
 * GET /api/auth/wechat/callback
 *
 * 双重角色：
 * 1. 无 code 参数 → 重定向到微信授权页（入口）
 * 2. 有 code 参数 → 换取 token → 获取用户 → 写入 session cookie
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  // 场景 1：无 code，重定向到微信授权页
  if (!code) {
    if (!WECHAT_APPID) {
      return NextResponse.redirect(`${origin}/login?error=wechat_config`)
    }

    const redirectUri = `${origin}/api/auth/wechat/callback`
    const state = crypto.randomUUID()

    const wechatUrl = new URL("https://open.weixin.qq.com/connect/qrconnect")
    wechatUrl.searchParams.set("appid", WECHAT_APPID)
    wechatUrl.searchParams.set("redirect_uri", redirectUri)
    wechatUrl.searchParams.set("response_type", "code")
    wechatUrl.searchParams.set("scope", "snsapi_login")
    wechatUrl.searchParams.set("state", state)
    // 必须带 #wechat_redirect
    wechatUrl.hash = "wechat_redirect"

    // 微信要求 redirect_uri URL 编码，用拼接方式处理 hash
    const finalUrl = `https://open.weixin.qq.com/connect/qrconnect?appid=${WECHAT_APPID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=snsapi_login&state=${state}#wechat_redirect`

    return NextResponse.redirect(finalUrl)
  }

  // 场景 2：有 code，换取 token 并登录
  try {
    // 用 code 换取 access_token + openid
    const tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${WECHAT_APPID}&secret=${WECHAT_SECRET}&code=${code}&grant_type=authorization_code`
    const tokenRes = await fetch(tokenUrl)
    const tokenData = await tokenRes.json()

    if (tokenData.errcode) {
      return NextResponse.redirect(`${origin}/login?error=wechat_token_failed`)
    }

    const { access_token, openid } = tokenData as {
      access_token: string
      openid: string
      refresh_token: string
      expires_in: number
    }

    // 获取用户信息
    const userInfoUrl = `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}&lang=zh_CN`
    const userInfoRes = await fetch(userInfoUrl)
    const userInfo = await userInfoRes.json()

    if (userInfo.errcode) {
      return NextResponse.redirect(`${origin}/login?error=wechat_userinfo_failed`)
    }

    const { nickname, headimgurl } = userInfo as {
      nickname: string
      headimgurl: string
      openid: string
    }

    // 根据 openid 查找或创建用户
    let user = await db.user.findUnique({
      where: { wechatOpenid: openid },
    })

    if (!user) {
      user = await db.user.create({
        data: {
          wechatOpenid: openid,
          nickname: nickname ?? "微信用户",
          avatar: headimgurl ?? null,
        },
      })
    }

    // 生成 NextAuth session token
    const { encode } = await import("next-auth/jwt")
    const secret = process.env.NEXTAUTH_SECRET ?? ""
    const token = await encode({
      token: { sub: user.id, userId: user.id, name: user.nickname ?? "用户" },
      secret,
      salt: "next-auth.session-token",
    })

    // 设置 NextAuth session cookie 并重定向
    const response = NextResponse.redirect(`${origin}/home`)
    response.cookies.set("next-auth.session-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 天
    })

    return response
  } catch {
    return NextResponse.redirect(`${origin}/login?error=wechat_failed`)
  }
}
