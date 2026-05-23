import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

const WECHAT_APPID = process.env.WECHAT_OPEN_APPID ?? ""
const WECHAT_SECRET = process.env.WECHAT_OPEN_APPSECRET ?? ""

/**
 * GET /api/auth/wechat/callback
 *
 * 三重角色：
 * 1. 无 code → 重定向到微信授权页（登录入口）
 * 2. 有 code + 无 bind → 换取 token → 登录
 * 3. 有 code + bind=1 → 换取 token → 绑定到当前用户
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const isBind = searchParams.get("bind") === "1"

  // 场景 1：无 code，重定向到微信授权页
  if (!code) {
    if (!WECHAT_APPID) {
      return NextResponse.redirect(`${origin}/login?error=wechat_config`)
    }

    const redirectUri = `${origin}/api/auth/wechat/callback`
    const state = crypto.randomUUID()

    const finalUrl = `https://open.weixin.qq.com/connect/qrconnect?appid=${WECHAT_APPID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=snsapi_login&state=${state}#wechat_redirect`

    return NextResponse.redirect(finalUrl)
  }

  // 场景 2/3：有 code，换取 token
  try {
    const tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${WECHAT_APPID}&secret=${WECHAT_SECRET}&code=${code}&grant_type=authorization_code`
    const tokenRes = await fetch(tokenUrl)
    const tokenData = await tokenRes.json()

    if (tokenData.errcode) {
      const redirect = isBind ? "/profile/settings?error=wechat_bind_failed" : "/login?error=wechat_token_failed"
      return NextResponse.redirect(`${origin}${redirect}`)
    }

    const { access_token, openid } = tokenData as {
      access_token: string
      openid: string
    }

    // 获取用户信息
    const userInfoUrl = `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}&lang=zh_CN`
    const userInfoRes = await fetch(userInfoUrl)
    const userInfo = await userInfoRes.json()

    if (userInfo.errcode) {
      const redirect = isBind ? "/profile/settings?error=wechat_bind_failed" : "/login?error=wechat_userinfo_failed"
      return NextResponse.redirect(`${origin}${redirect}`)
    }

    const { nickname, headimgurl } = userInfo as {
      nickname: string
      headimgurl: string
    }

    // 场景 3：绑定到当前登录用户
    if (isBind) {
      const session = await auth()
      if (!session?.user?.id) {
        return NextResponse.redirect(`${origin}/login`)
      }

      // 检查该 openid 是否已被其他用户绑定
      const existingUser = await db.user.findUnique({
        where: { wechatOpenid: openid },
      })
      if (existingUser && existingUser.id !== session.user.id) {
        return NextResponse.redirect(`${origin}/profile/settings?error=wechat_already_bound`)
      }

      // 绑定到当前用户
      await db.user.update({
        where: { id: session.user.id },
        data: { wechatOpenid: openid },
      })

      return NextResponse.redirect(`${origin}/profile/settings?success=wechat_bound`)
    }

    // 场景 2：登录
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

    const response = NextResponse.redirect(`${origin}/home`)
    response.cookies.set("next-auth.session-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    })

    return response
  } catch {
    const redirect = isBind ? "/profile/settings?error=wechat_bind_failed" : "/login?error=wechat_failed"
    return NextResponse.redirect(`${origin}${redirect}`)
  }
}
