import { NextResponse } from "next/server"
import crypto from "crypto"

/**
 * POST /api/wechat/signature
 * 生成微信 JS-SDK 签名
 *
 * 注意：生产环境需要配置以下环境变量：
 * - WECHAT_APP_ID: 微信公众号 AppID
 * - WECHAT_APP_SECRET: 微信公众号 AppSecret
 */

// 缓存 access_token（有效期 2 小时）
let tokenCache: { token: string; expiresAt: number } | null = null

// 缓存 jsapi_ticket（有效期 2 小时）
let ticketCache: { ticket: string; expiresAt: number } | null = null

/** 获取 access_token */
async function getAccessToken(): Promise<string> {
  const appId = process.env.WECHAT_APP_ID
  const appSecret = process.env.WECHAT_APP_SECRET

  if (!appId || !appSecret) {
    throw new Error("未配置微信公众号 AppID 或 AppSecret")
  }

  // 检查缓存
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.token
  }

  const res = await fetch(
    `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`
  )
  const data = await res.json()

  if (data.errcode) {
    throw new Error(`获取 access_token 失败: ${data.errmsg}`)
  }

  // 缓存 token（提前 5 分钟过期）
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000,
  }

  return data.access_token
}

/** 获取 jsapi_ticket */
async function getJsapiTicket(): Promise<string> {
  // 检查缓存
  if (ticketCache && ticketCache.expiresAt > Date.now()) {
    return ticketCache.ticket
  }

  const accessToken = await getAccessToken()
  const res = await fetch(
    `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${accessToken}&type=jsapi`
  )
  const data = await res.json()

  if (data.errcode !== 0) {
    throw new Error(`获取 jsapi_ticket 失败: ${data.errmsg}`)
  }

  // 缓存 ticket（提前 5 分钟过期）
  ticketCache = {
    ticket: data.ticket,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000,
  }

  return data.ticket
}

/** 生成签名 */
function generateSignature(ticket: string, nonceStr: string, timestamp: number, url: string): string {
  const str = `jsapi_ticket=${ticket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url}`
  return crypto.createHash("sha1").update(str).digest("hex")
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "缺少 url 参数" } },
        { status: 400 }
      )
    }

    const appId = process.env.WECHAT_APP_ID
    if (!appId) {
      return NextResponse.json(
        { success: false, error: { code: "CONFIG_ERROR", message: "未配置微信公众号" } },
        { status: 500 }
      )
    }

    const ticket = await getJsapiTicket()
    const nonceStr = crypto.randomBytes(16).toString("hex")
    const timestamp = Math.floor(Date.now() / 1000)
    const signature = generateSignature(ticket, nonceStr, timestamp, url)

    return NextResponse.json({
      success: true,
      data: {
        appId,
        timestamp,
        nonceStr,
        signature,
      },
    })
  } catch (err) {
    console.error("微信签名生成失败:", err)
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "签名生成失败" } },
      { status: 500 }
    )
  }
}
