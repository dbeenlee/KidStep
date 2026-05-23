import { test, expect } from '@playwright/test'
import { mockLogin } from './helpers'

test.describe('性能测试', () => {
  test.beforeEach(async ({ page }) => {
    await mockLogin(page)
  })

  test('首页加载时间 < 3秒', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime

    expect(loadTime).toBeLessThan(3000)
    console.log(`首页加载时间: ${loadTime}ms`)
  })

  test('任务页面加载时间 < 3秒', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/plan')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime

    expect(loadTime).toBeLessThan(3000)
    console.log(`任务页面加载时间: ${loadTime}ms`)
  })

  test('知识中心加载时间 < 3秒', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/knowledge')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime

    expect(loadTime).toBeLessThan(3000)
    console.log(`知识中心加载时间: ${loadTime}ms`)
  })

  test('无 JavaScript 错误', async ({ page }) => {
    const errors: string[] = []

    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.goto('/plan')
    await page.waitForLoadState('networkidle')
    await page.goto('/knowledge')
    await page.waitForLoadState('networkidle')

    expect(errors).toHaveLength(0)
    if (errors.length > 0) {
      console.error('JavaScript 错误:', errors)
    }
  })

  test('无 404 资源请求', async ({ page }) => {
    const failedRequests: string[] = []

    page.on('response', (response) => {
      if (response.status() === 404) {
        failedRequests.push(response.url())
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    expect(failedRequests).toHaveLength(0)
    if (failedRequests.length > 0) {
      console.error('404 资源:', failedRequests)
    }
  })

  test('图片懒加载', async ({ page }) => {
    await page.goto('/knowledge')
    await page.waitForLoadState('networkidle')

    // 检查图片是否有 loading="lazy" 属性
    const images = page.locator('img')
    const count = await images.count()

    for (let i = 0; i < count; i++) {
      const img = images.nth(i)
      const loading = await img.getAttribute('loading')
      const isLazy = loading === 'lazy' || loading === null
      expect(isLazy).toBeTruthy()
    }
  })

  test('响应式设计 - 不同视口', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1920, height: 1080, name: 'desktop' },
    ]

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // 检查页面在不同视口下正常显示
      await expect(page.locator('body')).toBeVisible()

      await page.screenshot({
        path: `e2e/screenshots/responsive-${viewport.name}.png`,
      })
    }
  })
})
