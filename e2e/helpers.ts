import { Page, expect } from '@playwright/test'

/**
 * E2E 测试辅助函数
 */

/**
 * 模拟登录（开发模式下任意6位验证码）
 */
export async function mockLogin(page: Page, phone = '13800138000') {
  await page.goto('/login')
  await page.waitForLoadState('networkidle')

  // 填写手机号
  const phoneInput = page.getByPlaceholder(/手机号/)
  await phoneInput.fill(phone)

  // 点击发送验证码
  const sendButton = page.getByRole('button', { name: /发送验证码|获取验证码/ })
  await sendButton.click()

  // 填写验证码（开发模式任意6位）
  const codeInput = page.getByPlaceholder(/验证码/)
  await codeInput.fill('123456')

  // 点击登录
  const loginButton = page.getByRole('button', { name: /登录/ })
  await loginButton.click()

  // 等待跳转到首页
  await page.waitForURL(/\/(home|dashboard)/, { timeout: 10_000 })
}

/**
 * 等待页面加载完成
 */
export async function waitForPageReady(page: Page) {
  await page.waitForLoadState('networkidle')
  // 等待主内容区域出现
  await expect(page.locator('main, [role="main"], .container').first()).toBeVisible()
}

/**
 * 导航到指定页面
 */
export async function navigateTo(page: Page, path: string) {
  await page.goto(path)
  await waitForPageReady(page)
}

/**
 * 检查 Toast 消息
 */
export async function expectToast(page: Page, message: string | RegExp) {
  const toast = page.getByRole('status').filter({ hasText: message })
  await expect(toast).toBeVisible({ timeout: 5_000 })
}

/**
 * 等待 API 响应
 */
export async function waitForApiResponse(page: Page, urlPattern: string | RegExp) {
  const response = await page.waitForResponse(urlPattern)
  return response
}

/**
 * 截图并附加到测试报告
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: `e2e/screenshots/${name}.png`,
    fullPage: true,
  })
}
