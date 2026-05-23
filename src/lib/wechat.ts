/**
 * 微信 JS-SDK 封装
 * @see https://developers.weixin.qq.com/doc/offiaccount/OA_Web_SDKs/JS-SDK.html
 *
 * 注意：微信 JS-SDK 需要公众号资质，以下为框架代码
 * 生产环境需要：
 * 1. 微信公众号（服务号）
 * 2. 配置 JS 安全域名
 * 3. 后端实现签名接口
 */

/** 微信分享配置 */
interface WechatShareConfig {
  title: string
  desc: string
  link: string
  imgUrl: string
}

/** 微信 JS-SDK 配置参数 */
interface WechatConfigParams {
  appId: string
  timestamp: number
  nonceStr: string
  signature: string
}

/**
 * 检测是否在微信浏览器内
 */
export function isWechatBrowser(): boolean {
  if (typeof navigator === "undefined") return false
  return /MicroMessenger/i.test(navigator.userAgent)
}

/**
 * 获取微信签名参数
 */
export async function getWechatSignature(url: string): Promise<WechatConfigParams | null> {
  try {
    const res = await fetch("/api/wechat/signature", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    })
    const data = await res.json()
    if (data.success) {
      return data.data
    }
  } catch {
    // 静默失败
  }
  return null
}

/**
 * 初始化微信 JS-SDK
 * @returns 是否初始化成功
 */
export async function initWechat(): Promise<boolean> {
  if (!isWechatBrowser()) return false

  try {
    // 动态加载微信 JS-SDK
    const script = document.createElement("script")
    script.src = "https://res.wx.qq.com/open/js/jweixin-1.6.0.js"
    document.head.appendChild(script)

    await new Promise<void>((resolve, reject) => {
      script.onload = () => resolve()
      script.onerror = () => reject(new Error("加载微信 JS-SDK 失败"))
    })

    // 获取签名参数
    const params = await getWechatSignature(window.location.href.split("#")[0])
    if (!params) return false

    // 配置 JS-SDK
    const wx = (window as unknown as { wx: WxApi }).wx
    wx.config({
      debug: false,
      appId: params.appId,
      timestamp: params.timestamp,
      nonceStr: params.nonceStr,
      signature: params.signature,
      jsApiList: [
        "updateAppMessageShareData",
        "updateTimelineShareData",
        "onMenuShareAppMessage",
        "onMenuShareTimeline",
      ],
    })

    return true
  } catch {
    return false
  }
}

/** 微信 API 接口 */
interface WxApi {
  config: (params: {
    debug: boolean
    appId: string
    timestamp: number
    nonceStr: string
    signature: string
    jsApiList: string[]
  }) => void
  ready: (callback: () => void) => void
  error: (callback: (err: { errMsg: string }) => void) => void
  updateAppMessageShareData: (params: WechatShareConfig & { success?: () => void }) => void
  updateTimelineShareData: (params: Omit<WechatShareConfig, "desc"> & { success?: () => void }) => void
}

/**
 * 设置微信分享内容
 */
export function setWechatShare(config: WechatShareConfig): void {
  if (!isWechatBrowser()) return

  const wx = (window as unknown as { wx: WxApi }).wx
  if (!wx) return

  wx.ready(() => {
    // 分享给朋友
    wx.updateAppMessageShareData({
      title: config.title,
      desc: config.desc,
      link: config.link,
      imgUrl: config.imgUrl,
      success: () => {
        console.log("微信分享配置成功")
      },
    })

    // 分享到朋友圈
    wx.updateTimelineShareData({
      title: config.title,
      link: config.link,
      imgUrl: config.imgUrl,
      success: () => {
        console.log("微信朋友圈分享配置成功")
      },
    })
  })

  wx.error((err) => {
    console.error("微信 JS-SDK 错误:", err.errMsg)
  })
}

/**
 * 触发微信分享（在微信浏览器内调用）
 * 注意：微信不允许直接调起分享面板，需要用户点击右上角
 * 此函数仅用于设置分享内容
 */
export function setupWechatShareForReport(childName: string, score: number, dimension: string): void {
  if (!isWechatBrowser()) return

  const baseUrl = window.location.origin
  setWechatShare({
    title: `${childName}的能力评估报告`,
    desc: `我在童行完成了${dimension}评估，得分${score}分！快来测测你的孩子吧`,
    link: `${baseUrl}/assessment`,
    imgUrl: `${baseUrl}/images/brand/app-icon.png`,
  })
}

/**
 * 触发微信分享（在微信浏览器内调用）
 * 用于海报分享场景
 */
export function setupWechatShareForPoster(childName: string): void {
  if (!isWechatBrowser()) return

  const baseUrl = window.location.origin
  setWechatShare({
    title: `${childName}的成长海报`,
    desc: `来看看${childName}在童行的成长记录！`,
    link: `${baseUrl}/profile/archive`,
    imgUrl: `${baseUrl}/images/brand/app-icon.png`,
  })
}
