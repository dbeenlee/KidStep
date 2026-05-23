/**
 * 自定义事件埋点工具
 * 使用 navigator.sendBeacon 异步发送，不阻塞页面
 */

/** 基础事件属性 */
interface BaseEventProperties {
  timestamp?: number
  url?: string
  userAgent?: string
}

/** 事件属性类型 */
type EventProperties = Record<string, string | number | boolean | null | undefined> & BaseEventProperties

/**
 * 发送埋点事件
 * @param name 事件名称
 * @param properties 事件属性
 */
export function trackEvent(name: string, properties?: EventProperties): void {
  if (typeof window === "undefined") return

  const payload = {
    name,
    properties: {
      ...properties,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    },
  }

  // 优先使用 sendBeacon（不阻塞页面卸载）
  if (navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" })
    navigator.sendBeacon("/api/analytics", blob)
  } else {
    // 降级使用 fetch
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      // 静默失败
    })
  }
}

/**
 * 追踪页面访问
 */
export function trackPageView(url?: string): void {
  trackEvent("page_view", {
    page: url ?? window.location.pathname,
  })
}

/**
 * 追踪用户行为
 */
export function trackAction(action: string, target: string, extra?: EventProperties): void {
  trackEvent("action", {
    action,
    target,
    ...extra,
  })
}

// ============ 业务埋点快捷函数 ============

/** 评估完成 */
export function trackAssessmentCompleted(dimension: string, score: number): void {
  trackEvent("assessment_completed", { dimension, score })
}

/** 任务完成 */
export function trackTaskCompleted(taskType: string, templateId: string): void {
  trackEvent("task_completed", { taskType, templateId })
}

/** 打卡完成 */
export function trackCheckinCompleted(type: string, streak: number): void {
  trackEvent("checkin_completed", { type, streak })
}

/** 文章阅读 */
export function trackArticleRead(category: string, articleId: string): void {
  trackEvent("article_read", { category, articleId })
}

/** 海报生成 */
export function trackPosterGenerated(): void {
  trackEvent("poster_generated")
}

/** 分享操作 */
export function trackShare(type: string, channel: string): void {
  trackEvent("share", { type, channel })
}

/** 收藏操作 */
export function trackFavorite(action: "add" | "remove", articleId: string): void {
  trackEvent("favorite", { action, articleId })
}
